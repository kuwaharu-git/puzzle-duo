# Puzzle Duo - 協力型オンラインパズルゲーム

## 概要
Puzzle Duoは2人のプレイヤーが協力して遊ぶオンラインパズルゲームです。各プレイヤーには異なる役割があり、互いに協力してパズルを解いていきます。

## 特徴
- **Player A（ヒント役）**: パズルのヒントや答えを見ることができる
- **Player B（操作役）**: 実際にパズルを操作する
- リアルタイムでのマルチプレイヤー同期
- 3つのステージで構成されたパズル

## 技術スタック
- **フロントエンド**: Next.js (React) + TailwindCSS
- **バックエンド**: Node.js (Express) + Socket.IO
- **通信**: WebSocketによるリアルタイム同期
- **環境**: Docker Compose

## セットアップ

### 必要な環境
- Docker
- Docker Compose

### インストールと起動

1. リポジトリをクローン:
```bash
git clone https://github.com/kuwaharu-git/puzzle-duo.git
cd puzzle-duo
```

2. Dockerコンテナをビルドして起動:
```bash
docker-compose up --build
```

3. ブラウザでアクセス:
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

## 遊び方

1. **部屋の作成**
   - トップページで「部屋を作成」をクリック
   - 表示された部屋IDを相手に共有

2. **部屋への参加**
   - トップページで部屋IDを入力
   - 「部屋に参加」をクリック

3. **ゲーム開始**
   - 2人揃ったら自動的にゲームが開始されます
   - Player Aはヒントを見て、Player Bに口頭で伝えます
   - Player Bはヒントを元に正しい操作を行います

4. **クリア条件**
   - 各ステージのパズルを正しく解くとクリア
   - 全3ステージをクリアするとゲーム完了

## 開発

### ローカル開発（Docker使用）
```bash
docker-compose up
```

### バックエンドのみ起動
```bash
cd backend
npm install
npm run dev
```

### フロントエンドのみ起動
```bash
cd frontend
npm install
npm run dev
```

## パズルの種類

### ステージ1: カラーシーケンス
Player Aには色の順番が表示され、Player Bは正しい順番で色を選択します。

### ステージ2: 数字計算
Player Aには計算式と答えが表示され、Player Bは正しい答えを選択します。

### ステージ3: 方向パターン
Player Aには矢印の順番が表示され、Player Bは正しい順番で方向を選択します。

## ライセンス
MIT