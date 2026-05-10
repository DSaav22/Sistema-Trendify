import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import Login from './Login';
import ProductoImagen from './ProductoImagen';

const PUBLIC_PRODUCTOS_URL = '/api/public/productos/';
const PUBLIC_CATEGORIAS_URL = '/api/public/categorias/';
const PUBLIC_CHECKOUT_URL = '/api/public/checkout/';
const MIS_PEDIDOS_URL = '/api/mis-pedidos/';
const REGISTRO_URL = '/api/auth/registro/';

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function currency(value) {
  return Number(value || 0).toLocaleString('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  });
}

function formatearFecha(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

export default function TiendaPublica({ onAccesoPersonal, user, logout, isAuthenticated }) {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('all');

  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  const [carrito, setCarrito] = useState([]);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('carrito');
  
  const [menuAbierto, setMenuAbierto] = useState(false);

  const isClienteAutenticado = isAuthenticated && user && Number(user?.id_rol?.id_rol || user?.id_rol) === 3;

  const [cliente, setCliente] = useState({
    nombre: '',
    telefono: '',
    ciudad: '',
    direccion: '',
  });
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  // Modales
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [mostrarMisPedidos, setMostrarMisPedidos] = useState(false);
  
  const [misPedidos, setMisPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const [registroForm, setRegistroForm] = useState({
      username: '', password: '', nombre_completo: '', telefono: '', ciudad: '', direccion: ''
  });
  const [registroError, setRegistroError] = useState('');
  const [registroSuccess, setRegistroSuccess] = useState(false);

  const itemsCount = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad, 0),
    [carrito]
  );

  const total = useMemo(
    () => carrito.reduce((acc, item) => acc + Number(item.precio_venta) * item.cantidad, 0),
    [carrito]
  );

  const productosFiltrados = useMemo(() => {
    if (filtroCategoria === 'all') return productos;
    return productos.filter((p) => Number(p.id_categoria) === Number(filtroCategoria));
  }, [productos, filtroCategoria]);

  useEffect(() => {
    let active = true;
    async function loadCatalogo() {
      setLoadingCatalogo(true);
      setErrorCatalogo('');
      try {
        const [resCategorias, resProductos] = await Promise.all([
          api.get(PUBLIC_CATEGORIAS_URL),
          api.get(PUBLIC_PRODUCTOS_URL),
        ]);
        if (!active) return;
        setCategorias(normalizeList(resCategorias.data));
        setProductos(normalizeList(resProductos.data));
      } catch (error) {
        if (active) setErrorCatalogo('No se pudo cargar la tienda. Verifica backend.');
      } finally {
        if (active) setLoadingCatalogo(false);
      }
    }
    loadCatalogo();
    return () => { active = false; };
  }, []);
  
  useEffect(() => {
     if (isClienteAutenticado && mostrarMisPedidos) {
         cargarMisPedidos();
     }
  }, [isClienteAutenticado, mostrarMisPedidos]);

  const cargarMisPedidos = async () => {
      setCargandoPedidos(true);
      try {
          const res = await api.get(MIS_PEDIDOS_URL);
          setMisPedidos(normalizeList(res.data));
      } catch(e) {
          console.error('Error cargando pedidos', e);
      } finally {
          setCargandoPedidos(false);
      }
  };

  const addToCart = (producto) => {
    setCheckoutError('');
    setCheckoutSuccess('');
    const id = Number(producto.id_producto ?? producto.id);
    setCarrito((prev) => {
      const exists = prev.find((item) => item.id_producto === id);
      if (!exists) {
        return [...prev, { ...producto, id_producto: id, cantidad: 1 }];
      }
      return prev.map((item) =>
        item.id_producto === id ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    });
  };

  const removeFromCart = (idProducto) => {
    setCarrito((prev) => prev.filter((item) => item.id_producto !== idProducto));
  };

  const updateQty = (idProducto, qty) => {
    if (qty <= 0) {
      removeFromCart(idProducto);
      return;
    }
    setCarrito((prev) =>
      prev.map((item) =>
        item.id_producto === idProducto ? { ...item, cantidad: qty } : item
      )
    );
  };

  const openCartDrawer = () => {
    setOpenCheckout(true);
    setCheckoutStep('carrito');
    setCheckoutError('');
  };

  const handleClienteChange = (event) => {
    const { name, value } = event.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const confirmarPago = async () => {
    setCheckoutError('');
    setCheckoutSuccess('');
    
    if (!isClienteAutenticado) {
        if (!cliente.nombre.trim() || !cliente.telefono.trim() || !cliente.ciudad.trim() || !cliente.direccion.trim()) {
          setCheckoutError('Completa todos los datos de envio.');
          return;
        }
    }

    if (carrito.length === 0) {
      setCheckoutError('El carrito esta vacio.');
      return;
    }

    setSubmittingCheckout(true);
    try {
      const payload = {
        cliente: isClienteAutenticado ? {} : {
          nombre: cliente.nombre.trim(),
          telefono: cliente.telefono.trim(),
          ciudad: cliente.ciudad.trim(),
          direccion: cliente.direccion.trim(),
        },
        metodo_pago: 'pago_movil_qr',
        carrito: carrito.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
        })),
      };

      const { data } = await api.post(PUBLIC_CHECKOUT_URL, payload);
      setCheckoutSuccess('Pedido confirmado. Venta #' + data.id_venta + ' registrada.');
      setCarrito([]);
      setCliente({ nombre: '', telefono: '', ciudad: '', direccion: '' });
      setCheckoutStep('carrito');
      setOpenCheckout(false);
    } catch (error) {
      setCheckoutError(error?.response?.data?.detail || 'No se pudo confirmar el pago.');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleRegistroSubmit = async (e) => {
      e.preventDefault();
      setRegistroError('');
      setRegistroSuccess(false);
      try {
          await api.post(REGISTRO_URL, registroForm);
          setRegistroSuccess(true);
          setTimeout(() => {
              setMostrarRegistro(false);
              setMostrarLogin(true);
          }, 2000);
      } catch(err) {
          setRegistroError(err?.response?.data?.detail || 'Ocurrio un error en el registro.');
      }
  };

  return (
    <div className="min-h-screen relative bg-[radial-gradient(circle_at_10%_5%,rgba(190,242,100,0.2),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(249,168,212,0.2),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#fefce8_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-600">Trendify</p>
            <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">Cosmetics Store</h1>
          </div>
          
          <div className="flex sm:hidden mt-2 ml-auto gap-2">
            <button onClick={openCartDrawer} className="relative rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              ❤ ({itemsCount})
            </button>
            <button onClick={() => setMenuAbierto(!menuAbierto)} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold">⚡ Menu</button>
          </div>

          <div className={`mt-3 w-full sm:mt-0 sm:flex sm:w-auto items-center gap-2 sm:gap-3 ${menuAbierto ? "block" : "hidden sm:flex"}`}>
            {isClienteAutenticado ? (
                <>
                <span className="font-semibold text-sm text-fuchsia-700 hidden lg:inline">Hola, {user?.username}</span>
                <button type="button" onClick={() => { setMostrarMisPedidos(true); setMenuAbierto(false); }} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 w-full sm:w-auto mt-2 sm:mt-0">Mis Pedidos</button>
                <button type="button" onClick={() => { logout(); setMenuAbierto(false); }} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 w-full sm:w-auto mt-2 sm:mt-0">Salir</button>
                </>
            ) : isAuthenticated ? (
                <>
                <button type="button" onClick={onAccesoPersonal} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 w-full sm:w-auto mt-2 sm:mt-0">Ir al Panel</button>
                <button type="button" onClick={logout} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 w-full sm:w-auto mt-2 sm:mt-0">Salir</button>
                </>
            ) : (
                <>
                <button type="button" onClick={() => { setMostrarRegistro(true); setMenuAbierto(false); }} className="rounded-full bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-500 w-full sm:w-auto mt-2 sm:mt-0">Registrarse</button>
                <button type="button" onClick={() => { setMostrarLogin(true); setMenuAbierto(false); }} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 w-full sm:w-auto mt-2 sm:mt-0">Iniciar Sesion</button>
                <button type="button" onClick={onAccesoPersonal} className="rounded-full hidden lg:inline border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100 w-full sm:w-auto mt-2 sm:mt-0">Staff</button>
                </>
            )}

            <button type="button" onClick={openCartDrawer} className="hidden sm:inline-flex relative rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Carrito
              <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-xs font-bold text-white">{itemsCount}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1300px] gap-6 px-4 pb-4 pt-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-10">
        <article className="rounded-3xl bg-slate-900 p-6 text-white shadow-2xl sm:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-lime-300">Nueva Coleccion</p>
          <h2 className="mt-3 max-w-xl text-3xl font-black leading-[1.05] sm:text-4xl lg:text-5xl">Maquillaje premium.</h2>
          <p className="mt-4 max-w-lg text-sm text-slate-200 sm:text-base">Compra rapido y paga desde tu celular. Hazte una cuenta para acceder a tu historial.</p>
          <button type="button" onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })} className="mt-7 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-lime-200 w-full sm:w-auto">
            Ver Catalogo
          </button>
        </article>

        <article className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 via-rose-50 to-violet-100 p-6 shadow-sm sm:p-8">
          <h3 className="mt-2 text-2xl font-black text-slate-900">Online y Seguro</h3>
          <p className="mt-3 text-sm text-slate-700">Puedes comprar como invitado anonimo o en tu cuenta personal.</p>
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white/75 px-3 py-3 shadow-sm"><p className="text-lg font-black text-slate-900">24h</p><p className="text-xs text-slate-600">Despacho</p></div>
            <div className="rounded-xl bg-white/75 px-3 py-3 shadow-sm"><p className="text-lg font-black text-slate-900">QR</p><p className="text-xs text-slate-600">Pago movil</p></div>
          </div>
        </article>
      </section>

      <main className="mx-auto w-full max-w-[1300px] px-4 pb-16 sm:px-6">
        {checkoutSuccess && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{checkoutSuccess}</p>}

        <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFiltroCategoria('all')} className={['whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition', filtroCategoria === 'all' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'].join(' ')}>Todas</button>
          {categorias.map((cat) => (
              <button key={cat.id_categoria} onClick={() => setFiltroCategoria(String(cat.id_categoria))} className={['whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition', String(filtroCategoria) === String(cat.id_categoria) ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'].join(' ')}>{cat.nombre}</button>
          ))}
        </div>

        {loadingCatalogo ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/50" />)}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productosFiltrados.map((producto) => (
                <article key={producto.id_producto} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-row sm:flex-col items-center sm:items-stretch">
                  <ProductoImagen
                    idProducto={producto.id_producto}
                    nombre={producto.nombre}
                    className="w-1/3 sm:w-full h-28 sm:h-40 shrink-0"
                  />
                  <div className="w-2/3 sm:w-full p-4 flex flex-col justify-between h-full">
                    <div>
                      <h4 className="line-clamp-2 text-sm sm:text-base font-bold text-slate-900">{producto.nombre}</h4>
                      <p className="mt-1 text-base sm:text-lg font-black text-slate-900">{currency(producto.precio_venta)}</p>
                    </div>
                    <button onClick={() => addToCart(producto)} className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800">Comprar</button>
                  </div>
                </article>
            ))}
          </div>
        )}
      </main>

      {/* MODAL MIS PEDIDOS */}
      {mostrarMisPedidos && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
              <div className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between">
                      <h3 className="text-2xl font-black">Historial de Compras</h3>
                      <button onClick={() => setMostrarMisPedidos(false)} className="text-slate-500 font-bold">X</button>
                  </div>
                  {cargandoPedidos ? <p className="mt-5">Cargando tus compras...</p> : (
                      <div className="mt-5 space-y-4">
                          {misPedidos.length === 0 ? <p className="text-slate-500">Aun no tienes compras confirmadas.</p> : misPedidos.map(pedido => (
                              <div key={pedido.id_venta} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                  <div className="flex justify-between font-bold border-b pb-2">
                                      <span>Venta #{pedido.id_venta}</span>
                                      <span className="text-indigo-600">{currency(pedido.monto_total)}</span>
                                  </div>
                                  <p className="text-xs mt-2 text-slate-600">Fecha: {formatearFecha(pedido.fecha_hora)} | Pago: {pedido.metodo_pago}</p>
                                  <ul className="mt-2 space-y-1">
                                      {pedido.detalles_venta?.map(det => (
                                          <li key={det.id_detalle_venta} className="text-sm flex justify-between">
                                              <span>{det.cantidad}x {det.producto_nombre}</span>
                                              <span>{currency(det.subtotal)}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* MODAL REGISTRO */}
      {mostrarRegistro && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-5">
                      <h3 className="text-2xl font-black">Crea tu Cuenta</h3>
                      <button onClick={() => setMostrarRegistro(false)} className="text-slate-500 font-bold border rounded px-2 hover:bg-slate-100">X Cerrar</button>
                  </div>
                  {registroSuccess ? <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl mb-4 font-bold">Registro exitoso! Iniciando sesion...</div> : (
                      <form onSubmit={handleRegistroSubmit} className="space-y-4">
                          {registroError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{registroError}</p>}
                          <div><label className="text-xs font-bold uppercase">Correo (Username) *</label><input required value={registroForm.username} onChange={e=>setRegistroForm({...registroForm, username: e.target.value})} className="w-full border p-2 rounded-xl mt-1" type="text" placeholder="juan@correo.com" /></div>
                          <div><label className="text-xs font-bold uppercase">Contrasena *</label><input required minLength={6} value={registroForm.password} onChange={e=>setRegistroForm({...registroForm, password: e.target.value})} className="w-full border p-2 rounded-xl mt-1" type="password" placeholder="Minimo 6 caracteres" /></div>
                          <div><label className="text-xs font-bold uppercase">Nombre Completo *</label><input required value={registroForm.nombre_completo} onChange={e=>setRegistroForm({...registroForm, nombre_completo: e.target.value})} className="w-full border p-2 rounded-xl mt-1" type="text" placeholder="Juan Perez" /></div>
                          <div className="grid grid-cols-2 gap-3">
                              <div><label className="text-xs font-bold uppercase">Telefono</label><input value={registroForm.telefono} onChange={e=>setRegistroForm({...registroForm, telefono: e.target.value})} className="w-full border p-2 rounded-xl mt-1" type="tel" /></div>
                              <div><label className="text-xs font-bold uppercase">Ciudad</label><input value={registroForm.ciudad} onChange={e=>setRegistroForm({...registroForm, ciudad: e.target.value})} className="w-full border p-2 rounded-xl mt-1" type="text" /></div>
                          </div>
                          <div><label className="text-xs font-bold uppercase">Direccion de Envio</label><input value={registroForm.direccion} onChange={e=>setRegistroForm({...registroForm, direccion: e.target.value})} className="w-full border p-2 rounded-xl mt-1" type="text" /></div>
                          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800">Registrarme</button>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* El LOGIN modal */}
      {mostrarLogin && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
              <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                  <button onClick={() => setMostrarLogin(false)} className="absolute top-4 right-4 text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full z-10 hover:bg-slate-200">X</button>
                  <div className="p-6 pt-10">
                      <Login minimal onSuccess={() => setMostrarLogin(false)} />
                  </div>
              </div>
         </div>
      )}

      {/* CHECKOUT DRAWER */}
      {openCheckout && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/60 transition-opacity">
          <div className="h-full w-full sm:w-[500px] overflow-y-auto bg-white p-5 sm:p-7 shadow-2xl animate-in slide-in-from-right">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Tu Carrito</h3>
              <button onClick={() => setOpenCheckout(false)} className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold hover:bg-slate-100">X Cerrar</button>
            </div>
            {checkoutError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{checkoutError}</p>}

            {checkoutStep === 'carrito' && (
              <div>
                {carrito.length === 0 ? <p className="text-slate-600 text-center py-8">Vacio.</p> : (
                  <div className="space-y-4">
                    {carrito.map((item) => (
                      <div key={item.id_producto} className="flex border-b border-slate-100 pb-4">
                         <div className="flex-1">
                           <p className="font-bold text-slate-800">{item.nombre}</p>
                           <p className="text-sm text-slate-500">{currency(item.precio_venta)}</p>
                           <div className="mt-2 flex items-center gap-2">
                            <button onClick={() => updateQty(item.id_producto, item.cantidad-1)} className="h-8 w-8 bg-slate-100 rounded-md font-bold">-</button>
                            <span className="w-8 text-center font-bold">{item.cantidad}</span>
                            <button onClick={() => updateQty(item.id_producto, item.cantidad+1)} className="h-8 w-8 bg-slate-100 rounded-md font-bold">+</button>
                           </div>
                         </div>
                         <div className="flex flex-col items-end justify-between ml-2">
                           <button onClick={() => removeFromCart(item.id_producto)} className="text-xs text-red-500 font-bold">Quitar</button>
                           <p className="font-black text-lg">{currency(item.cantidad * item.precio_venta)}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 rounded-2xl bg-slate-900 px-5 py-5 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Total a Pagar</p>
                  <p className="mt-1 text-3xl sm:text-4xl font-black">{currency(total)}</p>
                  <button onClick={() => setCheckoutStep('checkout')} disabled={carrito.length === 0} className="mt-5 w-full rounded-xl bg-lime-400 px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed">Proceder al Pago</button>
                </div>
              </div>
            )}

            {checkoutStep === 'checkout' && (
              <div className="animate-in fade-in duration-300">
                <button onClick={() => setCheckoutStep('carrito')} className="mb-4 text-sm font-bold text-slate-500">Volver</button>
                
                {isClienteAutenticado ? (
                    <div className="p-4 bg-fuchsia-50 text-fuchsia-900 rounded-xl mb-4 text-sm border border-fuchsia-100">
                        <strong>Hola {user?.username}</strong>, realizaremos la compra utilizando tu informacion de perfil guardada.
                    </div>
                ) : (
                    <div className="space-y-3 mb-5">
                      <p className="text-sm font-semibold mb-2">Completar Datos (Invitado)</p>
                      <input name="nombre" value={cliente.nombre} onChange={handleClienteChange} placeholder="Nombre completo" className="w-full border p-3 rounded-xl text-sm" />
                      <input name="telefono" value={cliente.telefono} onChange={handleClienteChange} placeholder="Telefono" className="w-full border p-3 rounded-xl text-sm" />
                      <input name="ciudad" value={cliente.ciudad} onChange={handleClienteChange} placeholder="Ciudad" className="w-full border p-3 rounded-xl text-sm" />
                      <textarea name="direccion" value={cliente.direccion} onChange={handleClienteChange} rows={2} placeholder="Direccion exacta" className="w-full border p-3 rounded-xl text-sm" />
                    </div>
                )}

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 text-center pt-2">QR Simple</p>
                  <div className="mx-auto h-32 w-32 bg-slate-900 grid place-items-center rounded-xl p-2 relative">
                    <div className="absolute top-2 left-2 bg-white w-4 h-4" />
                    <div className="absolute bottom-2 right-2 bg-white w-6 h-6" />
                    <div className="absolute top-2 right-6 bg-white w-2 h-2" />
                    <div className="text-white text-xs font-bold text-center">SCAN</div>
                  </div>
                  <p className="mt-3 text-center text-sm font-semibold mb-3">Total: {currency(total)}</p>
                </div>

                <button onClick={confirmarPago} disabled={submittingCheckout} className="mt-4 w-full rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white hover:bg-fuchsia-500 disabled:opacity-50">
                  {submittingCheckout ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
