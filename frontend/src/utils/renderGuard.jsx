/**
 * renderGuard.js - Utilidad para detectar y prevenir bucles infinitos de renderización
 * 
 * Esta utilidad proporciona un HOC (Higher Order Component) que monitorea
 * la frecuencia de renderización de un componente y detiene el renderizado
 * si detecta un patrón que parece ser un bucle infinito.
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * Opciones por defecto para la detección de bucles
 */
const defaultOptions = {
  maxRenders: 50,           // Número máximo de renderizaciones permitidas en el período
  timeWindow: 1000,         // Ventana de tiempo en ms para considerar un bucle (1 segundo)
  stopRender: true,         // Si debe detener el renderizado al detectar un bucle
  logWarning: true,         // Si debe mostrar advertencias en la consola
  logDetails: true,         // Si debe mostrar detalles adicionales
  disableInProduction: true // Si debe desactivarse en producción
};

/**
 * HOC que envuelve un componente con protección contra bucles de renderizado
 * 
 * @param {React.Component} Component - El componente a proteger
 * @param {string} componentName - Nombre del componente para logs (opcional)
 * @param {Object} options - Opciones para la detección de bucles
 * @returns {React.Component} - Componente protegido
 */
export const withRenderGuard = (Component, componentName, options = {}) => {
  // Combinar opciones con valores por defecto
  const config = { ...defaultOptions, ...options };
  
  // En producción, puede desactivarse para optimizar rendimiento
  if (config.disableInProduction && process.env.NODE_ENV === 'production') {
    return Component;
  }
  
  // Nombre para los logs
  const displayName = componentName || Component.displayName || Component.name || 'Componente';
  
  // Componente envoltorio
  const GuardedComponent = (props) => {
    // Estado para controlar si se debe mostrar el placeholder
    const [isStopped, setIsStopped] = useState(false);
    
    // Referencias para rastrear renderizaciones
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef([]);
    const hasWarnedRef = useRef(false);
    
    // Incrementar contador de renderizaciones y verificar bucles
    useEffect(() => {
      renderCountRef.current += 1;
      renderTimesRef.current.push(Date.now());
      
      // Solo mantener timestamps dentro de la ventana de tiempo
      const now = Date.now();
      renderTimesRef.current = renderTimesRef.current.filter(
        time => now - time < config.timeWindow
      );
      
      // Verificar si hay un posible bucle
      if (
        renderTimesRef.current.length >= config.maxRenders && 
        !hasWarnedRef.current
      ) {
        hasWarnedRef.current = true;
        
        if (config.logWarning) {
          console.warn(
            `⚠️ RenderGuard: Posible bucle de renderización detectado en "${displayName}"`
          );
          console.warn(
            `⚠️ ${renderTimesRef.current.length} renderizaciones en ${config.timeWindow}ms`
          );
          
          if (config.logDetails) {
            console.warn('Props del componente:', props);
            console.warn('Timestamps de renderizaciones:', renderTimesRef.current);
            console.warn('Sugerencia: Verifica tus useEffect y sus dependencias');
            console.warn('Sugerencia: Asegúrate de que las funciones en dependencias están memorizadas con useCallback');
            console.warn('Sugerencia: Revisa si estás modificando estados dentro de un render');
          }
        }
        
        // Detener renderizaciones si está configurado así
        if (config.stopRender) {
          setIsStopped(true);
        }
      }
    });
    
    // Si se ha detenido el renderizado, mostrar un placeholder
    if (isStopped) {
      return (
        <div style={{
          padding: '10px',
          margin: '10px',
          border: '2px solid #ff6b6b',
          borderRadius: '4px',
          backgroundColor: '#fff5f5',
          color: '#c92a2a'
        }}>
          <h3>Renderizado detenido: {displayName}</h3>
          <p>Se detectó un posible bucle infinito de renderización.</p>
          <p>Verifica la consola para más detalles.</p>
          <button
            onClick={() => {
              hasWarnedRef.current = false;
              renderTimesRef.current = [];
              setIsStopped(false);
            }}
            style={{
              padding: '5px 10px',
              backgroundColor: '#364fc7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Intentar reanudar
          </button>
        </div>
      );
    }
    
    // Renderizar el componente normalmente
    return <Component {...props} />;
  };
  
  // Mantener el nombre para DevTools
  GuardedComponent.displayName = `RenderGuard(${displayName})`;
  
  return GuardedComponent;
};

/**
 * Hook para detectar bucles de renderización dentro de un componente
 * 
 * @param {string} componentName - Nombre del componente para logs
 * @param {Object} options - Opciones para la detección de bucles
 */
export const useRenderGuard = (componentName, options = {}) => {
  // Combinar opciones con valores por defecto
  const config = { ...defaultOptions, ...options };
  
  // En producción, puede desactivarse
  if (config.disableInProduction && process.env.NODE_ENV === 'production') {
    return;
  }
  
  // Referencias para rastrear renderizaciones
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef([]);
  const hasWarnedRef = useRef(false);
  
  // Incrementar contador y verificar posibles bucles
  renderCountRef.current += 1;
  renderTimesRef.current.push(Date.now());
  
  // Solo mantener timestamps dentro de la ventana de tiempo
  const now = Date.now();
  renderTimesRef.current = renderTimesRef.current.filter(
    time => now - time < config.timeWindow
  );
  
  // Verificar si hay un posible bucle
  if (
    renderTimesRef.current.length >= config.maxRenders && 
    !hasWarnedRef.current
  ) {
    hasWarnedRef.current = true;
    
    if (config.logWarning) {
      console.warn(
        `⚠️ useRenderGuard: Posible bucle de renderización detectado en "${componentName}"`
      );
      console.warn(
        `⚠️ ${renderTimesRef.current.length} renderizaciones en ${config.timeWindow}ms`
      );
      
      if (config.logDetails) {
        console.warn('Timestamps de renderizaciones:', renderTimesRef.current);
        console.warn('Sugerencia: Verifica tus useEffect y sus dependencias');
        console.warn('Sugerencia: Asegúrate de que las funciones en dependencias están memorizadas con useCallback');
      }
    }
    
    // No podemos detener el renderizado desde un hook, solo advertir
  }
};

export default {
  withRenderGuard,
  useRenderGuard
}; 