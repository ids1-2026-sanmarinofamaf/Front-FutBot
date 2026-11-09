import { useState, useEffect } from 'react';
import { getBehaviorById } from './api';

export function useBehavior(id) {
  const [behavior, setBehavior] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getBehaviorById(id)
      .then((data) => {
        if (isMounted) setBehavior(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Error de comunicación con el servidor.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [id]);

  return { behavior, isLoading, error };
}