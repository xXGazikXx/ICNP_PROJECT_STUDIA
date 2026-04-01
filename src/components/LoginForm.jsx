import { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="container">
        <form className="card" onSubmit={handleSubmit}>
          <span className="login">Logowanie</span>

          {error && <div className="error">{error}</div>}

          <div className="inputBox">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span className="user">Login</span>
          </div>

          <div className="inputBox">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span>Hasło</span>
          </div>

          <button className="enter" type="submit" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-body);

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .login {
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 2px;
    display: block;
    font-weight: bold;
    font-size: x-large;
  }

  .error {
    color: #e74c3c;
    background: #ffeaea;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9em;
    width: 250px;
    text-align: center;
  }

  .card {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 350px;
    width: 340px;
    flex-direction: column;
    gap: 30px;
    background: var(--bg-card);
    box-shadow: 16px 16px 32px var(--shadow-color), -16px -16px 32px var(--shadow-color);
    border-radius: 12px;
    padding: 2rem;
  }

  .inputBox {
    position: relative;
    width: 250px;
  }

  .inputBox input {
    width: 100%;
    padding: 10px;
    outline: none;
    border: none;
    color: var(--text-primary);
    font-size: 1em;
    background: transparent;
    border-left: 2px solid var(--text-primary);
    border-bottom: 2px solid var(--text-primary);
    transition: 0.1s;
    border-bottom-left-radius: 8px;
  }

  .inputBox span {
    margin-top: 5px;
    position: absolute;
    left: 0;
    transform: translateY(-4px);
    margin-left: 10px;
    padding: 10px;
    pointer-events: none;
    font-size: 12px;
    color: var(--text-primary);
    text-transform: uppercase;
    transition: 0.5s;
    letter-spacing: 3px;
    border-radius: 8px;
  }

  .inputBox input:valid ~ span,
  .inputBox input:focus ~ span {
    transform: translateX(113px) translateY(-15px);
    font-size: 0.8em;
    padding: 5px 10px;
    background: var(--text-primary);
    letter-spacing: 0.2em;
    color: var(--bg-card);
    border: 2px;
  }

  .inputBox input:valid,
  .inputBox input:focus {
    border: 2px solid var(--text-primary);
    border-radius: 8px;
  }

  .enter {
    height: 45px;
    width: 120px;
    border-radius: 5px;
    border: 2px solid var(--text-primary);
    cursor: pointer;
    background-color: transparent;
    transition: 0.5s;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 2px;
    margin-bottom: 1em;
  }

  .enter:hover {
    background-color: var(--text-primary);
    color: var(--bg-card);
  }

  .enter:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
