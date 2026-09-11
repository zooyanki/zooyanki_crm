# Zooyanki CRM — веб-интерфейс

```bash
cp .env.example .env.local   # указать NEXT_PUBLIC_TENANT_ID
npm install
npm run api:types            # бэкенд должен слушать :3000
npm run dev                  # http://localhost:3000 → фронт на :3001
```

Типы API генерируются из OpenAPI бэкенда, руками не пишутся.
