import type { ScoringRequest, ScoringResponse } from '../types'

const SCORING_SYSTEM_PROMPT = `あなたはAI時代のコンサルタント戦略を評価する専門家です。
プレイヤーが選んだ「AIとの共創の方法」を以下の3軸で評価してください。

【評価軸】
1. AIに代替されない思考力（仮説構築・意思決定・創造性）
2. 人間的付加価値（信頼関係・倫理判断・文脈理解）
3. 適応戦略の持続可能性（短期でなく長期的に有効か）

【出力形式】
必ずJSON形式のみで返してください。マークダウンや説明文は不要です。
{
  "score": <0〜100の整数>,
  "peaceYears": <スコアに基づく平和継続年数>,
  "breakdown": [
    { "axis": "AIに代替されない思考力", "score": <0〜33>, "comment": "<一言>" },
    { "axis": "人間的付加価値", "score": <0〜33>, "comment": "<一言>" },
    { "axis": "適応戦略の持続可能性", "score": <0〜34>, "comment": "<一言>" }
  ],
  "summary": "<エピローグに表示する30字以内の評価コメント>"
}

【peaceYears換算表】
80〜100点 → 100年
60〜79点  → 50年
40〜59点  → 20年
20〜39点  → 5年
0〜19点   → 0（平和は長く続かなかった）`

function buildScoringPrompt(request: ScoringRequest): string {
  const lines = request.choices.map(
    (c, i) => `Q${i + 1}: ${c.questionText}\n選択: ${c.selectedOption}`
  )
  return `以下はプレイヤーが「AIとの共創」シナリオで選択した回答です。評価してください。\n\n${lines.join('\n\n')}`
}

const QUESTION_TEXTS: Record<string, string> = {
  q1_role_division:   'AIが進化するこの時代に、AIと人間の役割をどう分けると考えますか？',
  q2_consultant_value: 'AIが介在する時代に、人間のコンサルタントはどんな価値を持ちますか？',
  q3_adaptation:      'AIが急速に進化し続ける未来において、どう変化に対応し続けますか？',
}

export async function evaluatePlayerChoices(
  choices: { questionId: string; selectedOption: string }[]
): Promise<ScoringResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined

  if (!apiKey) {
    return generateFallbackScore(choices)
  }

  const request: ScoringRequest = {
    choices: choices.map((c) => ({
      questionId: c.questionId,
      questionText: QUESTION_TEXTS[c.questionId] ?? c.questionId,
      selectedOption: c.selectedOption,
    })),
  }

  const prompt = buildScoringPrompt(request)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SCORING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('Anthropic API error:', response.status)
      return generateFallbackScore(choices)
    }

    const data = await response.json() as {
      content: { type: string; text: string }[]
    }
    const text = data.content.find((c) => c.type === 'text')?.text ?? ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return generateFallbackScore(choices)
    }

    return JSON.parse(jsonMatch[0]) as ScoringResponse
  } catch (err) {
    console.error('Scoring API error:', err)
    return generateFallbackScore(choices)
  }
}

function generateFallbackScore(
  choices: { questionId: string; selectedOption: string }[]
): ScoringResponse {
  // Heuristic scoring when API is unavailable
  let score = 30
  for (const c of choices) {
    const opt = c.selectedOption
    if (opt.includes('仮説') || opt.includes('意思決定') || opt.includes('人間') || opt.includes('協働')) score += 15
    if (opt.includes('AIに全部') || opt.includes('不要') || opt.includes('守り続ける')) score -= 5
    if (opt.includes('信頼') || opt.includes('感情') || opt.includes('倫理')) score += 10
    if (opt.includes('学び直す') || opt.includes('楽しむ') || opt.includes('磨き続ける')) score += 10
  }
  score = Math.max(0, Math.min(100, score))

  let peaceYears = 0
  if (score >= 80) peaceYears = 100
  else if (score >= 60) peaceYears = 50
  else if (score >= 40) peaceYears = 20
  else if (score >= 20) peaceYears = 5

  return {
    score,
    peaceYears,
    breakdown: [
      { axis: 'AIに代替されない思考力', score: Math.floor(score / 3), comment: 'あなたの判断力は光っている' },
      { axis: '人間的付加価値', score: Math.floor(score / 3), comment: '人間ならではの強みがある' },
      { axis: '適応戦略の持続可能性', score: score - Math.floor(score / 3) * 2, comment: '変化への対応力がある' },
    ],
    summary: score >= 70 ? 'AI時代を生き抜く力がある' : score >= 40 ? 'まだ成長の余地がある' : '共創の道を模索中',
  }
}
