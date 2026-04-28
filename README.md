# 나만의 결혼 서포터

결혼 준비의 모든 것을 한 곳에서 관리하는 웹서비스입니다.

## 시작하기

```bash
npm install
npm run dev
```

## 빌드 & 배포

```bash
npm run build
```

Vercel에 GitHub 저장소를 연결하면 자동 배포됩니다.

## 기술 스택

- React 18 + TypeScript
- Vite
- React Router v6
- Zustand (상태관리)
- localStorage (데이터 저장 — Supabase 전환 준비됨)

## 파일 구조

```
src/
├── types/index.ts
├── services/storage.ts
├── stores/authStore.ts
├── data/checklistSeed.ts
├── components/layout/Layout.tsx
└── pages/
    ├── AuthPage.tsx
    ├── DashboardPage.tsx
    └── ChecklistPage.tsx
```