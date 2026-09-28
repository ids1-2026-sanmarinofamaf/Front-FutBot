{/*Antes de agregar rutas acá use: npm install react-router-dom */}

import { useContext } from "react";
import { AuthContext } from "../features/auth/AuthProvider.jsx";
import LoginView from "../features/auth/views/LoginView";
import MainView from "../app/App.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const AppRouter = () => {
    //Voy a mirar el pizarrón de autenticación y quiero saber qué dice isAuthenticated
    const { isAuthenticated, isSessionConnected } = useContext(AuthContext);

    return(
        <BrowserRouter>
            <Routes>
                {isAuthenticated && isSessionConnected ? (
                    <>
                        <Route path="/" element={<MainView />} />
                    </>
                ) : (
                    <Route path="/" element={<LoginView />} />
                )}
            </Routes>
        </BrowserRouter>
    )
};

export default AppRouter;