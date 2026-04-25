import { useState } from 'react';

export default function ModelSculptor({ city, onFinish }) {
  const [layers, setLayers] = useState(2);
  const [learningRate, setLearningRate] = useState('0.01');
  const [regularization, setRegularization] = useState('medium');
  const accuracy =
    52 +
    (layers === 3 ? 18 : layers === 2 ? 10 : 4) +
    (learningRate === '0.01' ? 16 : learningRate === '0.001' ? 12 : 2) +
    (regularization === 'medium' ? 10 : regularization === 'low' ? 4 : 6);
  const success = accuracy >= 80;

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Model Sculptor</span>
      <h3>{`${city.title}: tune the toy network`}</h3>
      <div className="mini-stats">
        <article>
          <span>Layers</span>
          <strong>{layers}</strong>
        </article>
        <article>
          <span>Projected Accuracy</span>
          <strong>{`${accuracy}%`}</strong>
        </article>
      </div>
      <div className="logic-chip-actions">
        <button className="assessment-ghost-btn" onClick={() => setLayers(1)}>1 Layer</button>
        <button className="assessment-ghost-btn" onClick={() => setLayers(2)}>2 Layers</button>
        <button className="assessment-ghost-btn" onClick={() => setLayers(3)}>3 Layers</button>
      </div>
      <div className="logic-chip-actions">
        <button className="assessment-ghost-btn" onClick={() => setLearningRate('0.1')}>LR 0.1</button>
        <button className="assessment-ghost-btn" onClick={() => setLearningRate('0.01')}>LR 0.01</button>
        <button className="assessment-ghost-btn" onClick={() => setLearningRate('0.001')}>LR 0.001</button>
      </div>
      <div className="logic-chip-actions">
        <button className="assessment-ghost-btn" onClick={() => setRegularization('low')}>Low Reg</button>
        <button className="assessment-ghost-btn" onClick={() => setRegularization('medium')}>Medium Reg</button>
        <button className="assessment-ghost-btn" onClick={() => setRegularization('high')}>High Reg</button>
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          onClick={() =>
            onFinish({
              success,
              xp: success ? 50 : 17,
              mistake: success ? '' : 'Model Sculptor: hyperparameters caused weak accuracy or overfitting risk',
            })
          }
        >
          Train Model
        </button>
      </div>
    </div>
  );
}
