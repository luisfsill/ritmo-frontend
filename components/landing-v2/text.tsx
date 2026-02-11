import React from 'react';

/**
 * Renderiza texto com ênfase markdown (**texto**) como elementos <strong>.
 * Também aceita tags <strong> já presentes no texto.
 * 
 * @param text - Texto com marcação **bold** em markdown ou tags <strong>
 * @returns ReactNode com emphasis renderizado
 */
export function renderEmphasis(text: string): React.ReactNode {
  // Se o texto já contém tags HTML <strong>, renderiza diretamente
  if (text.includes('<strong>')) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  // Converte markdown **texto** para <strong>texto</strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return <strong key={index}>{content}</strong>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}
