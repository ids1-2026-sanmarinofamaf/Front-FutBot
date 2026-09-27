export const sendDataToAPI = async (user) => {
    return (fetch("/sessions", {
        method:"POST",
        body: JSON.stringify(user)
    }))
};

export const checkSession = async () => {
    return fetch("/users/me", {
        method: "GET"
    });
};

