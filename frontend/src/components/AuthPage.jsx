import { useMemo, useState } from 'react';
import '../landing.css';

const COPY = {
  login: {
    eyebrow: 'Welcome Back',
    title: 'Log in to continue.',
    subtitle: 'Pick up your journey where you left off.',
    submit: 'Log In',
    switchLabel: "Don't have an account?",
    switchAction: 'Create one',
  },
  signup: {
    eyebrow: 'Start Your Journey',
    title: 'Create your account.',
    subtitle: 'Begin your SkillQuest journey.',
    submit: 'Sign Up',
    switchLabel: 'Already have an account?',
    switchAction: 'Log in',
  },
};

function fieldClass(hasError) {
  return `auth-field${hasError ? ' has-error' : ''}`;
}

export default function AuthPage({ mode, onSubmit, onSwitchMode, onBackHome, isBusy, serverError }) {
  const copy = COPY[mode];
  const [values, setValues] = useState({
    fullName: '',
    username: '',
    email: '',
    login: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const fields = useMemo(() => {
    if (mode === 'signup') {
      return [
        { key: 'fullName', label: 'Full name', type: 'text' },
        { key: 'username', label: 'Username', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'password', label: 'Password', type: 'password' },
        { key: 'confirmPassword', label: 'Confirm password', type: 'password' },
      ];
    }

    return [
      { key: 'login', label: 'Email or username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ];
  }, [mode]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function validate() {
    const nextErrors = {};

    if (mode === 'signup') {
      if (values.fullName.trim().length < 2) nextErrors.fullName = 'Enter your full name.';
      if (!/^[A-Za-z0-9_]{3,32}$/.test(values.username.trim())) {
        nextErrors.username = 'Use 3 to 32 letters, numbers, or underscores.';
      }
      if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) nextErrors.email = 'Enter a valid email.';
      if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
      if (values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords do not match.';
    } else {
      if (values.login.trim().length < 3) nextErrors.login = 'Enter your email or username.';
      if (values.password.length < 8) nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    if (mode === 'signup') {
      await onSubmit({
        full_name: values.fullName.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      return;
    }

    await onSubmit({
      login: values.login.trim(),
      password: values.password,
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-form-wrap">
          <form className="auth-form" onSubmit={handleSubmit}>
            <button type="button" className="auth-home-link" onClick={onBackHome}>
              Back to home
            </button>

            <div className="auth-form-head">
              <p className="auth-kicker">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>

            <div className="auth-field-grid">
              {fields.map((field) => (
                <label
                  key={field.key}
                  className={`${fieldClass(Boolean(errors[field.key]))}${field.key === 'fullName' ? ' span-2' : ''}`}
                >
                  <span>{field.label}</span>
                  <input
                    name={field.key}
                    type={field.type}
                    value={values[field.key]}
                    onChange={handleChange}
                    autoComplete={
                      field.key === 'email'
                        ? 'email'
                        : field.key === 'fullName'
                          ? 'name'
                          : field.key === 'username'
                            ? 'username'
                            : field.key === 'password'
                              ? mode === 'signup'
                                ? 'new-password'
                                : 'current-password'
                              : 'off'
                    }
                  />
                  {errors[field.key] ? <small>{errors[field.key]}</small> : null}
                </label>
              ))}
            </div>

            {serverError ? <div className="auth-server-error">{serverError}</div> : null}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isBusy}
            >
              {isBusy ? 'Please wait...' : copy.submit}
            </button>

            <div className="auth-switch-row">
              <span>{copy.switchLabel}</span>
              <button type="button" className="auth-switch-btn" onClick={onSwitchMode}>
                {copy.switchAction}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
