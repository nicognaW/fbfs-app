import { cssBundleHref } from '@remix-run/css-bundle'
import {
	type DataFunctionArgs,
	type HeadersFunction,
	json,
	type LinksFunction,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { Confetti } from './components/confetti.tsx'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { href as iconsHref, Icon } from './components/ui/icon.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import { ThemeSwitch, useTheme } from './routes/resources+/theme/index.tsx'
import { getTheme } from './routes/resources+/theme/theme.server.ts'
import fontStylestylesheetUrl from './styles/font.css'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { authenticator, getUserId } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { getFlashSession } from './utils/flash-session.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.ts'
import { useNonce } from './utils/nonce-provider.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { useToast } from './utils/useToast.tsx'
import * as React from 'react'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'preload', href: fontStylestylesheetUrl, as: 'style' },
		{ rel: 'preload', href: tailwindStylesheetUrl, as: 'style' },
		cssBundleHref ? { rel: 'preload', href: cssBundleHref, as: 'style' } : null,
		{ rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
		{
			rel: 'alternate icon',
			type: 'image/png',
			href: '/favicons/favicon-32x32.png',
		},
		{ rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{ rel: 'stylesheet', href: fontStylestylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? '鱼越大鱼越小生成器' : 'Error | 鱼越大鱼越小生成器' },
		{ name: 'description', content: `生成有趣的滑坡谬误推理链！` },
	]
}

export async function loader({ request }: DataFunctionArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					prisma.user.findUnique({
						where: { id: userId },
						select: { id: true, name: true, username: true, imageId: true },
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
		  )
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await authenticator.logout(request, { redirectTo: '/' })
	}
	const { flash, headers: flashHeaders } = await getFlashSession(request)

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			flash,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				flashHeaders,
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: 'dark' | 'light'
	env?: Record<string, string>
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
				<LiveReload nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const theme = useTheme()
	useToast(data.flash?.toast)

	return (
		<Document nonce={nonce} theme={theme} env={data.ENV}>
			<div className="flex h-screen flex-col justify-between">
				<header className="container py-6">
					<nav className="flex justify-between">
						<Link to="/">
							<div className="font-light">鱼越大</div>
							<div className="font-bold">鱼越小生成器</div>
						</Link>
					</nav>
				</header>

				<div className="flex-1">
					<Outlet />
				</div>

				<div className="container flex justify-between pb-5">
					<a href="https://github.com/nicognaW" target="_blank">
						<Icon name="github">
							<span className="sr-only">GitHub</span>
						</Icon>
					</a>
					<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
				</div>
			</div>
			<Confetti confetti={data.flash?.confetti} />
			<Toaster />
		</Document>
	)
}

export default withSentry(App)

export function ErrorBoundary() {
	// the nonce doesn't rely on the loader so we can access that
	const nonce = useNonce()

	// NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
	// likely failed to run so we have to do the best we can.
	// We could probably do better than this (it's possible the loader did run).
	// This would require a change in Remix.

	// Just make sure your root route never errors out and you'll always be able
	// to give the user a better UX.

	return (
		<Document nonce={nonce}>
			<GeneralErrorBoundary />
		</Document>
	)
}
