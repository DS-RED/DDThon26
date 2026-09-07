import { AuthProvider, useAuth } from './auth/AuthProvider.jsx';
import { CartProvider } from './cart/CartProvider.jsx';
import SetupPage from './pages/SetupPage.jsx';
import Cafe from './world/Cafe.jsx';

// Once a table session exists, drop the player into the 3D cafe.
function CustomerApp() {
  const { session } = useAuth();
  if (!session) return <SetupPage />;
  return (
    <CartProvider key={`${session.table.storeId}:${session.table.id}`} table={session.table}>
      <Cafe />
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CustomerApp />
    </AuthProvider>
  );
}
