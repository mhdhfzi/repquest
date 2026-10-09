import { Redirect } from 'expo-router';

/**
 * Landing spot for the Google sign-in return link. The in-app browser normally handles it,
 * but if the link opens the app directly we just continue to the right screen.
 */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
