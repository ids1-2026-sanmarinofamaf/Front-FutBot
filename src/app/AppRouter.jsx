{/*Antes de agregar rutas acá use: npm install react-router-dom */}

import { useContext } from "react";
import { AuthContext } from "../features/auth/authProvider.jsx";
import LoginView from "../features/auth/views/LoginView";
import MainView from "../app/App.jsx";

const AppRouter = () => {
    const { isAuthenticated } = useContext(AuthContext);

    if (isAuthenticated) {
        return <MainView />;
    }
    return <LoginView />;
};

export default AppRouter;