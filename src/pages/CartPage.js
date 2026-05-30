import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../App';

const formatIdr = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

const CartPage = () => {
  const { session } = useContext(UserContext);
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [qtyDraftByCartItemId, setQtyDraftByCartItemId] = useState({});

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Load cart from backend
  const loadCart = async () => {
    if (!session?.userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cart/${session.userId}`);
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Gagal load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.userId) {
      loadCart();
    }
  }, [session?.userId]);

  // Group items by toko
  const groupedCart = useMemo(() => {
    const groups = {};
    cart.items?.forEach(item => {
      const tokoId = item.productId?.tokoId || 'toko-default';
      const tokoNama = item.productId?.tokoNama || 'Toko Safety Pro';
      if (!groups[tokoId]) {
        groups[tokoId] = { tokoId, tokoNama, items: [] };
      }
      groups[tokoId].items.push(item);
    });
    return Object.values(groups);
  }, [cart.items]);

  const subtotal = useMemo(() => {
    return cart.items?.reduce((sum, item) => sum + (item.harga * item.qty), 0) || 0;
  }, [cart.items]);

  const voucherCatalog = [
    { code: 'JSMS10', type: 'percent', value: 10, minSubtotal: 100000, desc: 'Diskon 10%' },
    { code: 'JSMS20', type: 'fixed', value: 20000, minSubtotal: 200000, desc: 'Diskon Rp20.000' },
    { code: 'KUNING15', type: 'percent', value: 15, minSubtotal: 150000, desc: 'Diskon 15%' },
  ];

  const discount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (subtotal < (appliedVoucher.minSubtotal || 0)) return 0;
    if (appliedVoucher.type === 'percent') {
      return Math.round(subtotal * (appliedVoucher.value / 100));
    }
    return Math.min(subtotal, appliedVoucher.value);
  }, [appliedVoucher, subtotal]);

  const total = Math.max(0, subtotal - discount);

  const updateCartItem = async (itemId, updates) => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/${session.userId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await loadCart();
      }
    } catch (err) {
      console.error('Gagal update item:', err);
    }
  };

  const deleteCartItem = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/${session.userId}/items/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadCart();
      }
    } catch (err) {
      console.error('Gagal hapus item:', err);
    }
  };

  const handleIncreaseQty = (item) => {
    const newQty = (item.qty || 1) + 1;
    updateCartItem(item._id, { qty: newQty });
  };

  const handleDecreaseQty = (item) => {
    const newQty = Math.max(1, (item.qty || 1) - 1);
    updateCartItem(item._id, { qty: newQty });
  };

  const handleSetQty = (itemId) => {
    const draft = qtyDraftByCartItemId[itemId];
    if (draft) {
      updateCartItem(itemId, { qty: parseInt(draft, 10) });
      setQtyDraftByCartItemId(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const handleChangeColor = (itemId, warnaBaru) => {
    updateCartItem(itemId, { warna: warnaBaru });
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Hapus item ini dari keranjang?')) {
      deleteCartItem(itemId);
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError('Masukkan kode voucher');
      return;
    }
    const match = voucherCatalog.find(v => v.code === code);
    if (!match) {
      setAppliedVoucher(null);
      setVoucherError('Kode voucher tidak valid');
      return;
    }
    if (subtotal < (match.minSubtotal || 0)) {
      setAppliedVoucher(null);
      setVoucherError(`Subtotal minimal ${formatIdr(match.minSubtotal)} untuk voucher ini`);
      return;
    }
    setAppliedVoucher({
      code: match.code,
      type: match.type,
      value: match.value,
      minSubtotal: match.minSubtotal,
      desc: match.desc
    });
    setVoucherError('');
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
    setVoucherCode('');
  };

  if (loading) return <div className="p-6 text-center">Memuat keranjang...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Header Mewah */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-yellow-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">
                🛒 Keranjang Belanja
              </h1>
              <p className="text-gray-500 mt-1">APD & Alat Safety berkualitas</p>
            </div>
            <div className="hidden sm:grid grid-cols-2 gap-3">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300 shadow-inner">
                <div className="text-xs text-yellow-700 font-semibold">Subtotal</div>
                <div className="text-xl font-black text-yellow-800">{formatIdr(subtotal)}</div>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg">
                <div className="text-xs opacity-90 font-semibold">Total</div>
                <div className="text-xl font-black">{formatIdr(total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri - Daftar Produk (Grid dalam Grid) */}
          <div className="lg:col-span-8 space-y-6">
            {groupedCart.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl border border-yellow-100 p-12 text-center">
                <div className="text-7xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold text-gray-900">Keranjang masih kosong</h2>
                <p className="text-gray-500 mt-2">Yuk, tambah produk safety sekarang!</p>
              </div>
            ) : (
              groupedCart.map((toko, tokoIdx) => (
                <div key={toko.tokoId} className="bg-white rounded-3xl shadow-xl border border-yellow-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  {/* Header Toko */}
                  <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-yellow-100 via-yellow-50 to-transparent border-b border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-md">
                        <span className="text-2xl">🏪</span>
                      </div>
                      <div>
                        <div className="text-xs text-yellow-600 font-semibold">Toko</div>
                        <div className="text-lg font-bold text-gray-800">{toko.tokoNama}</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 text-sm font-bold">
                      {toko.items.length} item
                    </div>
                  </div>

                  {/* Grid Produk dalam Toko */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {toko.items.map((item) => {
                        const draftQty = qtyDraftByCartItemId[item._id];
                        const inputValue = draftQty !== undefined ? draftQty : String(item.qty || 1);
                        const warnaOptions = item.productId?.warnaOptions || [item.warna || 'Standar'];

                        return (
                          <div key={item._id} className="bg-gradient-to-br from-white to-yellow-50/30 rounded-2xl border border-yellow-100 p-5 hover:shadow-lg transition-all duration-300">
                            {/* Info Produk */}
                            <div className="flex gap-4 mb-4">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center shadow-inner">
                                <span className="text-3xl">🧴</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-gray-800 text-lg truncate">{item.namaProduk}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.productId?.deskripsi || 'Safety equipment berkualitas'}</p>
                              </div>
                            </div>

                            {/* Harga & Subtotal Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-gray-50 rounded-xl p-2 text-center">
                                <div className="text-xs text-gray-500">Harga</div>
                                <div className="text-base font-bold text-gray-800">{formatIdr(item.harga)}</div>
                              </div>
                              <div className="bg-yellow-50 rounded-xl p-2 text-center">
                                <div className="text-xs text-yellow-600">Subtotal</div>
                                <div className="text-base font-extrabold text-yellow-700">{formatIdr(item.harga * (item.qty || 1))}</div>
                              </div>
                            </div>

                            {/* Warna Options */}
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-gray-600 mb-2">🎨 Pilih Warna</div>
                              <div className="flex flex-wrap gap-2">
                                {warnaOptions.map((w) => {
                                  const active = item.warna === w;
                                  return (
                                    <button
                                      key={w}
                                      type="button"
                                      onClick={() => handleChangeColor(item._id, w)}
                                      className={`px-3 py-1.5 rounded-full border text-sm transition-all duration-200 ${
                                        active
                                          ? 'border-yellow-500 bg-yellow-500 text-white shadow-md scale-105'
                                          : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-300 hover:text-yellow-700'
                                      }`}
                                    >
                                      {w}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Quantity Controller Grid */}
                            <div className="grid grid-cols-12 gap-2 mb-4">
                              <div className="col-span-5 flex items-center gap-2">
                                <button onClick={() => handleDecreaseQty(item)} className="w-9 h-9 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-800 font-extrabold hover:bg-yellow-100 transition">
                                  −
                                </button>
                                <input
                                  type="text"
                                  value={inputValue}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setQtyDraftByCartItemId(prev => ({ ...prev, [item._id]: val }));
                                  }}
                                  onBlur={() => handleSetQty(item._id)}
                                  className="w-12 text-center py-2 rounded-xl border border-gray-200 bg-white font-bold outline-none focus:ring-2 focus:ring-yellow-300"
                                />
                                <button onClick={() => handleIncreaseQty(item)} className="w-9 h-9 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-800 font-extrabold hover:bg-yellow-100 transition">
                                  +
                                </button>
                              </div>
                              <div className="col-span-4">
                                <button onClick={() => handleSetQty(item._id)} className="w-full py-2 rounded-xl bg-yellow-500 text-white font-bold text-sm shadow hover:bg-yellow-600 transition">
                                  Ubah
                                </button>
                              </div>
                              <div className="col-span-3">
                                <button onClick={() => handleDeleteItem(item._id)} className="w-full py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 font-bold text-sm hover:bg-red-100 transition">
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Kolom Kanan - Voucher & Ringkasan (Grid Vertikal) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Voucher Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-yellow-100 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">
                  🎫 Voucher
                </h2>
                {appliedVoucher && (
                  <button onClick={handleRemoveVoucher} className="text-sm font-bold text-red-500 hover:text-red-700 transition">
                    Hapus
                  </button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12">
                  <input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Masukkan kode voucher"
                    className="w-full p-3 rounded-xl border-2 border-yellow-200 bg-yellow-50 outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                  />
                </div>
                <div className="col-span-12">
                  <button onClick={handleApplyVoucher} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-extrabold shadow-md hover:shadow-xl transition-all duration-300">
                    ✨ Terapkan Voucher
                  </button>
                </div>
              </div>

              {voucherError && (
                <div className="mt-3 p-2 bg-red-50 rounded-xl text-sm font-bold text-red-600 text-center">
                  {voucherError}
                </div>
              )}

              {appliedVoucher && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300">
                  <div className="text-xs font-semibold text-yellow-800">✅ Voucher aktif</div>
                  <div className="text-2xl font-black text-yellow-900">{appliedVoucher.code}</div>
                  <div className="text-sm text-gray-700 mt-1">{appliedVoucher.desc}</div>
                  <div className="text-sm font-bold text-yellow-800 mt-2">Diskon: {formatIdr(discount)}</div>
                </div>
              )}

              {/* Daftar Voucher Tersedia dalam Grid */}
              <div className="mt-5 pt-4 border-t border-yellow-100">
                <div className="text-xs font-semibold text-gray-500 mb-3">✨ Voucher tersedia:</div>
                <div className="grid grid-cols-3 gap-2">
                  {voucherCatalog.map(v => (
                    <div key={v.code} className="bg-gray-50 rounded-xl p-2 text-center">
                      <div className="text-xs font-bold text-yellow-700">{v.code}</div>
                      <div className="text-xs text-gray-600">{v.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ringkasan Belanja Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-yellow-100 p-6 hover:shadow-2xl transition-all duration-300">
              <h2 className="text-xl font-black bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent mb-5">
                📋 Ringkasan Belanja
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-bold text-gray-800">{formatIdr(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diskon</span>
                    <span className="font-bold text-green-600">- {formatIdr(discount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-semibold">Total</span>
                    <span className="text-2xl font-black text-yellow-700">{formatIdr(total)}</span>
                  </div>
                </div>

                <button
                  className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-extrabold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  onClick={() => alert(`Checkout\nTotal: ${formatIdr(total)}\nVoucher: ${appliedVoucher?.code || '-'}`)}
                >
                  🚀 Checkout Sekarang
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Gratis ongkir min. belanja Rp200.000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;