# Inventra Frontend

Dashboard frontend untuk sistem Inventra menggunakan Next.js App Router.

## Stack

- Next.js
- React + TypeScript
- Tailwind CSS

## Struktur Folder

```text
inventra-frontend/
	app/
		(protected)/
			items/
				_components/
			transactions/
				_components/
			users/
				_components/
			roles/
				_components/
		login/
	components/
		common/
		layout/
	hooks/
	lib/
		api/
		auth/
		utils/
	public/
	types/
```

Dokumentasi arsitektur tambahan tersedia di docs/ARCHITECTURE.md.

## Prasyarat

- Backend harus berjalan dari ../inventra-backend
- API backend aktif di http://localhost:3001

## Menjalankan Frontend

```bash
npm run dev
```

Aplikasi berjalan di http://localhost:3000

## Environment

Gunakan origin backend berikut:

NEXT_PUBLIC_API_URL=http://localhost:3001

Contoh konfigurasi tersedia pada .env.example.

## Build Production

```bash
npm run build
npm run start
```

## Demo Login

- Email: admin@inventra.com
- Password: admin123
