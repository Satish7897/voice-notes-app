import React, { useState, useEffect } from 'react';

const AnalogClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  const hourDegrees = (hours * 30) + (minutes * 0.5);
  const minuteDegrees = minutes * 6;
  const secondDegrees = seconds * 6;

  // Format date as Day, Month Date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determine greeting based on hour
  const hour = currentTime.getHours();
  let greeting = '';
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning 🌅';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Good afternoon ☀️';
  } else {
    greeting = 'Good night 🌙';
  }

  return (
    <div className="clock-container">
      <div className="analog-clock">
        <div className="clock-face">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="hour-marker"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-25px)`
              }}
            >
              <span style={{ display: 'inline-block', transform: `rotate(${-i * 30}deg)` }}>{i === 0 ? 12 : i}</span>
            </div>
          ))}
          <div 
            className="hand hour-hand"
            style={{ transform: `rotate(${hourDegrees}deg)` }}
          />
          <div 
            className="hand minute-hand"
            style={{ transform: `rotate(${minuteDegrees}deg)` }}
          />
          <div 
            className="hand second-hand"
            style={{ transform: `rotate(${secondDegrees}deg)` }}
          />
          <div className="center-dot" />
        </div>
      </div>
      <div className="date">{formatDate(currentTime)}</div>
      <div className="clock-greeting">{greeting}</div>
    </div>
  );
};

export default AnalogClock; 