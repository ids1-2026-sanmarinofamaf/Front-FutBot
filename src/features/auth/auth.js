export const saveTokenLocalStorage = (allData) => {
    localStorage.setItem("token",allData.token)
};

export const getToken = () => {
    return localStorage.getItem("token");
};

export const removeToken = () => {
    localStorage.removeItem("token");
};