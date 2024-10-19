'use client'
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get('http://127.0.0.1:8000/');
            setData(response.data);
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Data from FastAPI</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
