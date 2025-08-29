import Router from "./route/Index";
import ThemeProvider from "./layout/provider/Theme";
import { AuthProvider } from "./contexts/AuthContext";
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('Ngo9BigBOggjHTQxAR8/V1JEaF1cWmhAYVFxWmFZfVtgcV9GZVZSRWYuP1ZhSXxWdk1hUX9bcHJRT2ZfVUN9XEI=');


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