import { redirect } from 'next/navigation';

/**
 * Catch-all for unmatched routes — send visitors to the home page instead of
 * showing a 404. Rendered by Next.js whenever no route matches (or a route
 * calls notFound()).
 */
export default function NotFound() {
  redirect('/');
}
