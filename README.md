# The Last Consultant — セットアップ手順

## 必要なもの
- [Node.js](https://nodejs.org/) v18以上

## インストールと起動

```bash
# プロジェクトフォルダで実行
npm install

# 開発サーバー起動（ブラウザが自動で開く）
npm run dev
```

## AIスコアリング機能（True Ending）の有効化

1. `.env.example` をコピーして `.env` を作成:
   ```bash
   cp .env.example .env
   ```
2. `.env` ファイルを開き、Anthropic APIキーを設定:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-xxxx...
   ```
3. APIキーは https://console.anthropic.com で取得できます

> **注意**: APIキーなしでも True Ending はプレイ可能です（ローカルスコアリングで代替）

## GitHub Pages へのデプロイ

```bash
npm run build
# dist/ フォルダを gh-pages ブランチへプッシュ
```

## ゲームの進め方

| ルート | 条件 | エンディング |
|--------|------|-------------|
| 💀 Bad | 筋肉おじさんと修行 → ちから全振り | テロリストエンディング |
| 🏆 Good | 賢者じいさんと修行 → かしこさ重視 | スカウトエンディング |
| ✨ True | 魔物使いRyuと共闘 → AIとの共創 | 共創エンディング（AIスコアリング） |

## 技術スタック

- React 18 + TypeScript
- Tailwind CSS
- Zustand（状態管理 + localStorage自動セーブ）
- Vite
- Anthropic API（True Endingスコアリング）
