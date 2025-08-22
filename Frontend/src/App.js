import Router from "./route/Index";
import ThemeProvider from "./layout/provider/Theme";
import { AuthProvider } from "./contexts/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </AuthProvider>
  );
};
export default App;