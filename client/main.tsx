import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { Room } from './pages/Room'
import { Root } from './pages/Root'
import { ErrorBoundary } from '../src/components/ErrorBoundary'

// Error element for routes
const errorElement = (
  <ErrorBoundary>
    <div className="route-error">
      <h2>Page Error</h2>
      <p>Sorry, something went wrong loading this page.</p>
      <button onClick={() => window.location.reload()}>Refresh Page</button>
    </div>
  </ErrorBoundary>
);

const router = createBrowserRouter([
	{
		path: '/',
		element: (
			<ErrorBoundary>
				<Root />
			</ErrorBoundary>
		),
		errorElement,
	},
	{
		path: '/:roomId',
		element: (
			<ErrorBoundary>
				<Room />
			</ErrorBoundary>
		),
		errorElement,
	},
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
)
