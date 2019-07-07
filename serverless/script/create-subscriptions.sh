#!/bin/sh

# curl -X POST http://localhost:3000/subscriptions \
# -H "Content-Type: application/json" \
# -d @- << EOF
# { "name": "新着 デビュー作品",
#   "condition": {
#     "site": "FANZA",
#     "service": "digital",
#     "floor": "videoa",
#     "article": "genre",
#     "article_id": 6006,
#     "gte_date": "#TODAY",
#     "hits": 100
#   },
#   "exceptCondition": {
#     "genre": [3036, 6793]
#   }
# }
# EOF

# 深田えいみ
# curl http://localhost:3000/subscriptions/actress/1048468/subscribe

# 桜空もも
curl http://localhost:3000/subscriptions/actress/1039157/subscribe

# 天使もえ
# curl http://localhost:3000/subscriptions/actress/1025419/subscribe

# 羽月希
# curl http://localhost:3000/subscriptions/actress/1005108/subscribe