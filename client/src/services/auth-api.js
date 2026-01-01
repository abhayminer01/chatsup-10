import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1/auth',
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
