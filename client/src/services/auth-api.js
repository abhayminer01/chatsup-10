import axios from 'axios';

const api = axios.create({
    baseURL: 'https://chatsup-10.onrender.com/api/v1/auth',
    withCredentials: true,
});

export const guestLogin = async () => {
    try {
        const res = await api.get('/guest');
        console.log(res);
        return res.data;
    } catch (error) {
        console.error(error);
    }
};
