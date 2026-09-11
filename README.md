# Zooyanki CRM — веб-интерфейс

```bash
cp .env.example .env.local
npm install
npm run api:types            # бэкенд должен слушать :3000
npm run dev -- --port 3001   # http://localhost:3001/login
```

Типы API генерируются из OpenAPI бэкенда, руками не пишутся.
Авторизация — JWT; арендатор больше не передаётся заголовком.
