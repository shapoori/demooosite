/**
 * دمو سایت - منطق کاربری، منوها، تایمر تخفیف ویژه و پنجره‌های تعاملی
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearchAutocomplete();
  initFlashSaleCountdown();
  initQuickViewModal();
  initCouponForm();
});

// مدیریت منوی موبایل
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  const menu = document.getElementById('mobile-menu-drawer');
  const overlay = document.getElementById('mobile-menu-overlay');

  if (!toggleBtn || !menu) return;

  function openMenu() {
    menu.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
    menu.classList.add('translate-x-0', 'opacity-100');
    if (overlay) {
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.add('opacity-100'), 10);
    }
    document.body.classList.add('overflow-hidden');
  }

  function closeMenu() {
    menu.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    menu.classList.remove('translate-x-0', 'opacity-100');
    if (overlay) {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
    document.body.classList.remove('overflow-hidden');
  }

  toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);
}

// تایمر شمارش معکوس تخفیف ویژه (فلش‌سیل) استیچ
function initFlashSaleCountdown() {
  const timerContainers = document.querySelectorAll('.flash-sale-timer');
  if (timerContainers.length === 0) return;

  // زمان پایه: ۸ ساعت و ۴۲ دقیقه و ۱۵ ثانیه
  let remainingSeconds = 8 * 3600 + 42 * 60 + 15;

  function updateDisplay() {
    if (remainingSeconds <= 0) {
      remainingSeconds = 24 * 3600; // ریست دوره بعدی
    }
    remainingSeconds--;

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    timerContainers.forEach(container => {
      const hEl = container.querySelector('.timer-hours');
      const mEl = container.querySelector('.timer-minutes');
      const sEl = container.querySelector('.timer-seconds');

      if (hEl) hEl.textContent = hStr;
      if (mEl) mEl.textContent = mStr;
      if (sEl) sEl.textContent = sStr;
    });
  }

  updateDisplay();
  setInterval(updateDisplay, 1000);
}

// سیستم جستجوی زنده با پیش‌نمایش در هدر
function initSearchAutocomplete() {
  const searchInputs = document.querySelectorAll('.header-search-input');
  searchInputs.forEach(input => {
    const parent = input.closest('.search-container') || input.parentElement;
    let resultsBox = parent.querySelector('.search-results-dropdown');

    if (!resultsBox) {
      resultsBox = document.createElement('div');
      resultsBox.className = 'search-results-dropdown hidden absolute top-full right-0 left-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto divide-y divide-slate-800/60';
      parent.appendChild(resultsBox);
    }

    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        resultsBox.classList.add('hidden');
        resultsBox.innerHTML = '';
        return;
      }

      if (typeof PRODUCTS === 'undefined') return;

      const matched = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.englishName.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.categoryFa.toLowerCase().includes(query)
      );

      if (matched.length === 0) {
        resultsBox.innerHTML = `
          <div class="p-4 text-center text-slate-400 text-xs">
            محصولی با مشخصات «${e.target.value}» در دمو سایت یافت نشد.
          </div>
        `;
        resultsBox.classList.remove('hidden');
        return;
      }

      let html = '';
      matched.slice(0, 5).forEach(prod => {
        html += `
          <div class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer" onclick="openProductQuickView('${prod.id}')">
            <div class="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-950">
              <img src="${prod.image || 'assets/images/whey-gold.jpg'}" alt="${prod.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-white truncate">${prod.name}</div>
              <div class="text-[10px] text-slate-400 truncate">${prod.englishName} • ${prod.brand}</div>
            </div>
            <div class="text-left rtl:text-right flex-shrink-0">
              <span class="text-xs font-black text-orange-400">${formatPrice(prod.price)} <span class="text-[10px] text-slate-400">تومان</span></span>
            </div>
          </div>
        `;
      });

      html += `
        <div class="p-2 text-center pt-3">
          <a href="products.html?q=${encodeURIComponent(query)}" class="text-xs text-orange-400 hover:text-orange-300 font-bold block">
            مشاهده تمام نتایج (${matched.length} مکمل در دمو سایت) ←
          </a>
        </div>
      `;

      resultsBox.innerHTML = html;
      resultsBox.classList.remove('hidden');
    });

    document.addEventListener('click', (ev) => {
      if (!parent.contains(ev.target)) {
        resultsBox.classList.add('hidden');
      }
    });
  });
}

// فرم اعمال کد تخفیف در سبد خرید
function initCouponForm() {
  const couponForm = document.getElementById('drawer-coupon-form');
  if (!couponForm) return;

  couponForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('drawer-coupon-input');
    if (!input) return;

    const res = cartManager.applyCoupon(input.value);
    if (res.success) {
      cartManager.showToast(res.message, 'success');
      input.value = '';
    } else {
      cartManager.showToast(res.message, 'error');
    }
  });
}

// مودال پیش‌نمایش سریع مکمل (Quick View)
function initQuickViewModal() {
  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-300';
    modal.innerHTML = `
      <div id="quick-view-dialog" class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl transform scale-95 transition-all duration-300 flex flex-col max-h-[90vh]">
        <!-- هدر مودال -->
        <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            <span class="text-xs font-bold text-slate-300">بررسی تخصصی مکمل در دمو سایت</span>
          </div>
          <button type="button" onclick="closeProductQuickView()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- محتوای مودال -->
        <div id="quick-view-content" class="overflow-y-auto p-5 sm:p-6 space-y-6">
          <!-- با جاوااسکریپت پر می‌شود -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProductQuickView();
    });
  }
}

function openProductQuickView(productId) {
  if (typeof PRODUCTS === 'undefined') return;
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const content = document.getElementById('quick-view-content');
  const modal = document.getElementById('quick-view-modal');
  const dialog = document.getElementById('quick-view-dialog');
  if (!content || !modal) return;

  let flavorsHtml = '';
  product.flavors.forEach((flv, idx) => {
    flavorsHtml += `
      <label class="cursor-pointer">
        <input type="radio" name="qv-flavor" value="${flv}" ${idx === 0 ? 'checked' : ''} class="peer sr-only">
        <span class="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 text-xs font-medium peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 transition-all inline-block">
          ${flv}
        </span>
      </label>
    `;
  });

  let weightsHtml = '';
  product.weights.forEach((wt, idx) => {
    weightsHtml += `
      <label class="cursor-pointer">
        <input type="radio" name="qv-weight" value="${wt}" ${idx === 0 ? 'checked' : ''} class="peer sr-only">
        <span class="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 text-xs font-medium peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 transition-all inline-block">
          ${wt}
        </span>
      </label>
    `;
  });

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <!-- تصویر و ویژگی‌های بصری -->
      <div class="space-y-4">
        <div class="aspect-square rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden border border-slate-800" style="background: radial-gradient(circle at center, ${product.accentColor}25 0%, ${product.imageColor} 80%);">
          <div class="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-md">
            ٪${product.discountPercent} تخفیف
          </div>
          <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            اصالت تضمین دمو سایت
          </div>

          <!-- تصویر واقعی مکمل ورزشی با وضوح بالا -->
          <div class="w-full h-64 sm:h-72 relative flex items-center justify-center p-2 my-1">
            <img src="${product.image || 'assets/images/whey-gold.jpg'}" alt="${product.name}" class="w-full h-full object-contain rounded-xl filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)]">
          </div>

          <div class="text-center mt-2">
            <span class="text-xs text-slate-400 font-bold">${product.categoryFa}</span>
          </div>
        </div>

        <!-- نشان‌های اعتماد -->
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span class="text-emerald-400">✓</span> بچ‌نامبر تایید شده
          </div>
          <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span class="text-orange-400">⚡</span> ارسال فوری به کل ایران
          </div>
        </div>
      </div>

      <!-- اطلاعات و خرید -->
      <div class="space-y-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-orange-500">${product.brandFa} (${product.brand})</span>
            <span class="text-slate-600">•</span>
            <div class="flex items-center text-amber-400 text-xs">
              <span>★ ${product.rating}</span>
              <span class="text-slate-400 text-[10px] mr-1">(${product.reviewsCount} نظر)</span>
            </div>
          </div>
          <h3 class="text-lg sm:text-xl font-black text-white leading-snug">${product.name}</h3>
          <p class="text-xs text-slate-400 mt-1 font-mono">${product.englishName}</p>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">${product.description}</p>

        <!-- انتخاب وزن -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-2">انتخاب وزن / تعداد سروینگ:</label>
          <div class="flex flex-wrap gap-2" id="qv-weight-group">
            ${weightsHtml}
          </div>
        </div>

        <!-- انتخاب طعم -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-2">انتخاب طعم مکمل:</label>
          <div class="flex flex-wrap gap-2" id="qv-flavor-group">
            ${flavorsHtml}
          </div>
        </div>

        <!-- قیمت و دکمه‌ها -->
        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div class="flex items-baseline justify-between">
            <div>
              <span class="text-xs text-slate-400 line-through ml-2">${formatPrice(product.originalPrice)}</span>
              <span class="text-xl font-black text-white font-chivo">${formatPrice(product.price)}</span>
              <span class="text-xs font-medium text-orange-400 mr-1">تومان</span>
            </div>
            <span class="text-xs font-bold text-emerald-400">موجود در انبار دمو سایت</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <!-- افزودن به سبد خرید -->
            <button type="button" onclick="submitQuickViewCart('${product.id}')" class="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              افزودن به سبد خرید
            </button>

            <!-- خرید مستقیم و انتقال به تسویه حساب -->
            <button type="button" onclick="buyNowDirect('${product.id}')" class="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              خرید مستقیم و تسویه
            </button>
          </div>
        </div>

        <!-- جدول ارزش تغذیه‌ای -->
        <div class="mt-4 pt-4 border-t border-slate-800">
          <h4 class="text-xs font-bold text-slate-300 mb-2">جدول حقایق تغذیه‌ای (در هر وعده):</h4>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs">
            <div class="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-slate-400 text-[10px] block">پروتئین</span>
              <span class="font-bold text-orange-400">${product.nutritionFacts.protein}</span>
            </div>
            <div class="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-slate-400 text-[10px] block">کالری</span>
              <span class="font-bold text-white">${product.nutritionFacts.calories}</span>
            </div>
            <div class="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-slate-400 text-[10px] block">کربوهیدرات</span>
              <span class="font-bold text-white">${product.nutritionFacts.carbs}</span>
            </div>
            <div class="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="text-slate-400 text-[10px] block">چربی</span>
              <span class="font-bold text-white">${product.nutritionFacts.fat}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('opacity-0', 'pointer-events-none');
  dialog.classList.remove('scale-95');
  dialog.classList.add('scale-100');
  document.body.classList.add('overflow-hidden');
}

function closeProductQuickView() {
  const modal = document.getElementById('quick-view-modal');
  const dialog = document.getElementById('quick-view-dialog');
  if (!modal) return;

  modal.classList.add('opacity-0', 'pointer-events-none');
  if (dialog) {
    dialog.classList.remove('scale-100');
    dialog.classList.add('scale-95');
  }
  document.body.classList.remove('overflow-hidden');
}

function submitQuickViewCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const weightInput = document.querySelector('input[name="qv-weight"]:checked');
  const flavorInput = document.querySelector('input[name="qv-flavor"]:checked');

  const weight = weightInput ? weightInput.value : product.weights[0];
  const flavor = flavorInput ? flavorInput.value : product.flavors[0];

  cartManager.addItem(product, weight, flavor, 1);
  closeProductQuickView();
}

function buyNowDirect(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const weightInput = document.querySelector('input[name="qv-weight"]:checked');
  const flavorInput = document.querySelector('input[name="qv-flavor"]:checked');

  const weight = weightInput ? weightInput.value : product.weights[0];
  const flavor = flavorInput ? flavorInput.value : product.flavors[0];

  cartManager.addItem(product, weight, flavor, 1);
  closeProductQuickView();
  window.location.href = 'checkout.html';
}
