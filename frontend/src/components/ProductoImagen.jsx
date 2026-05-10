import { useEffect, useState } from 'react';

const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];

export default function ProductoImagen({
  idProducto,
  nombre,
  className = '',
  placeholderClassName = '',
  imgClassName = '',
}) {
  const [extIndex, setExtIndex] = useState(0);

  // Si cambia el id de producto, reiniciar la cascada de extensiones
  useEffect(() => {
    setExtIndex(0);
  }, [idProducto]);

  const inicial = (nombre || '?').charAt(0).toUpperCase();
  const todasFallaron = extIndex >= EXTENSIONES.length;

  if (todasFallaron) {
    return (
      <div
        className={[
          'flex items-center justify-center bg-gradient-to-br from-fuchsia-50 to-amber-50',
          className,
          placeholderClassName,
        ].join(' ')}
      >
        <div className="flex h-2/3 w-2/3 max-h-20 max-w-20 items-center justify-center rounded-2xl bg-white/80 text-xl font-black text-slate-700 shadow-sm">
          {inicial}
        </div>
      </div>
    );
  }

  const src = `/products/${idProducto}.${EXTENSIONES[extIndex]}`;

  return (
    <div
      className={[
        'flex items-center justify-center overflow-hidden bg-gradient-to-br from-fuchsia-50 to-amber-50',
        className,
      ].join(' ')}
    >
      <img
        src={src}
        alt={nombre || `Producto ${idProducto}`}
        loading="lazy"
        onError={() => setExtIndex((i) => i + 1)}
        className={['h-full w-full object-cover', imgClassName].join(' ')}
      />
    </div>
  );
}
