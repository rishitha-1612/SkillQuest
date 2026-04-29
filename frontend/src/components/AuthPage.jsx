import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import '../landing.css';

const COPY = {
  login: {
    eyebrow: 'Welcome Back',
    title: 'Log in to continue your expedition.',
    subtitle: 'Pick up your progress, reopen your realms, and jump straight back into SkillQuest.',
    submit: 'Log In',
    switchLabel: "Don't have an account?",
    switchAction: 'Create one',
  },
  signup: {
    eyebrow: 'Start Your Journey',
    title: 'Create your SkillQuest account.',
    subtitle: 'Save your progress, keep your identity across sessions, and unlock a proper learner profile.',
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
        { key: 'fullName', label: 'Full name', type: 'text', placeholder: 'Rishitha Kumar' },
        { key: 'username', label: 'Username', type: 'text', placeholder: 'questpilot' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'At least 8 characters' },
        { key: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat your password' },
      ];
    }

    return [
      { key: 'login', label: 'Email or username', type: 'text', placeholder: 'you@example.com or questpilot' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Your password' },
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
      <div className="auth-backdrop-glow auth-backdrop-glow-1" />
      <div className="auth-backdrop-glow auth-backdrop-glow-2" />

      <section className="auth-shell">
        <motion.div
          className="auth-side-panel"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <button type="button" className="auth-home-link" onClick={onBackHome}>
            Back to home
          </button>
          <p className="auth-kicker">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="auth-copy">{copy.subtitle}</p>

          <div className="auth-side-highlights">
            <article>
              <span>Persistent account</span>
              <strong>Real SQLite-backed users and sessions</strong>
            </article>
            <article>
              <span>Protected entry</span>
              <strong>Only authenticated players can enter the live world lobby</strong>
            </article>
            <article>
              <span>Same visual language</span>
              <strong>The auth flow keeps the cinematic SkillQuest landing theme intact</strong>
            </article>
          </div>
        </motion.div>

        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08 }}
        >
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-head">
              <h2>{mode === 'signup' ? 'Create Account' : 'Account Login'}</h2>
              <p>{mode === 'signup' ? 'Create your learner profile to begin.' : 'Use your account to continue.'}</p>
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
                    placeholder={field.placeholder}
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

            <motion.button
              type="submit"
              className="auth-submit-btn"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              disabled={isBusy}
            >
              {isBusy ? 'Please wait...' : copy.submit}
            </motion.button>

            <div className="auth-switch-row">
              <span>{copy.switchLabel}</span>
              <button type="button" className="auth-switch-btn" onClick={onSwitchMode}>
                {copy.switchAction}
              </button>
            </div>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
