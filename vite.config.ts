import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN
const SENTRY_ORG        = process.env.SENTRY_ORG        // Sentry org slug (문자열)
const SENTRY_PROJECT    = process.env.SENTRY_PROJECT    // Sentry project slug

export default defineConfig({
  plugins: [
    react(),
    // SENTRY_AUTH_TOKEN + ORG + PROJECT 세 값 모두 있을 때만 소스맵 업로드
    ...(SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT
      ? [
          sentryVitePlugin({
            org:       SENTRY_ORG,
            project:   SENTRY_PROJECT,
            authToken: SENTRY_AUTH_TOKEN,
            release:   { name: '1.3.2' },
            sourcemaps: {
              assets: './dist/**',
              ignore: ['node_modules'],
            },
            telemetry: false,
          }),
        ]
      : []),
  ],
  build: {
    sourcemap: true,   // 소스맵 생성 (Sentry 에러 원본 코드 매핑)
  },
})
