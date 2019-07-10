# dmm-title-watcher

[![CircleCI](https://circleci.com/gh/aiji42/dmm-title-watcher/tree/master.svg?style=svg)](https://circleci.com/gh/aiji42/dmm-title-watcher/tree/master)

## Description

監視条件(Subscription)を登録して、定期的に新着タイトルがあるかどうかの通知を Slack で受ける  
各種作品タイトルはブックマークが可能で、発売日にリマインドしてくれる

## Useage

```bash
$ cp .env.sample .env # 本番デプロイ用.env
$ cp .env.sample .env.dev # 開発環境用.env
# それぞれ.envファイル内の各種KEYを埋める

$ docker-compose up # 開発環境立ち上げ
$ docker-compose run --rm serverless npm test # テスト

$ docker-compose -f docker-compose.prod.yml up # 本番リリース
# CircleCIに対応しているので、そちらでデプロイしたほうがいい
```

## Requirement

- DMM アフィ登録
    - DMM_AFFILIATE_ID と DMM_API_ID を取得しておく
- Slack Bot のトークン
    - TOKEN と 通知先の CHANNEL_ID を取得しておく
- AWS アカウント
    - AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY (AWS_DEFAULT_REGION) それぞれ取得しておく
- Docker
    - インストールしておく
- CircleCI

## Licence

[MIT](https://github.com/aiji42/dmm-title-watcher/blob/master/LICENSE)

## Author

[aiji42](https://github.com/aiji42)
