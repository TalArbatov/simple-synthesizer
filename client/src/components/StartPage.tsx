import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function StartPage() {
    const [sessionName, setSessionName] = useState('');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const [step, setStep] = useState<'session' | 'username'>('session');

    function onSubmit() {
        navigate('/synth');
    }

    return (
        <div className="start-page">
            <div className="start-window">
                <h2 className="start-window-title">Dual Osc Synth</h2>
                <div className="start-input-row">
                    <input
                        type="text"
                        className="start-input"
                        placeholder="Enter Session Name"
                        value={sessionName}
                        onChange={e => setSessionName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
                    />
                    <button className="start-button" onClick={onSubmit}>
                        Enter
                    </button>
                </div>
            </div>
        </div>
    );
}
