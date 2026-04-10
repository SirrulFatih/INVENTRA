# Inventra Frontend

Frontend dashboard untuk sistem Inventra, dibangun dengan Next.js App Router dan Tailwind CSS.

## Prasyarat

- Backend harus berjalan dari folder `../inventra-backend`
- API backend aktif di `http://localhost:3001`

## Menjalankan Frontend

```bash
npm run dev
```

App akan berjalan di:

`http://localhost:3000`

## Environment

Gunakan URL origin backend berikut:

`NEXT_PUBLIC_API_URL=http://localhost:3001`

Contoh tersedia di file `.env.example`.

## Login Demo

- Email: `admin@inventra.com`
- Password: `admin123`

## Build Production

```bash
npm run build
npm run start
```
