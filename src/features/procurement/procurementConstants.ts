import React from 'react';
import { type SearchableSelectOption, toast } from '../../components/ui';

const h = React.createElement;

export interface SelectOption {
  value: string;
  label: string;
}

export const PAYMENT_TERMS_OPTIONS: SelectOption[] = [
  { value: 'Cash Payment', label: 'Cash Payment' },
  { value: 'Immediate Payment', label: 'Immediate Payment' },
  { value: 'Net 15 Days', label: 'Net 15 Days' },
  { value: 'Net 30 Days', label: 'Net 30 Days' },
  { value: 'Net 45 Days', label: 'Net 45 Days' },
  { value: 'Net 60 Days', label: 'Net 60 Days' },
  { value: 'Net 90 Days', label: 'Net 90 Days' },
  { value: 'Cash on Delivery (COD)', label: 'Cash on Delivery (COD)' },
  { value: 'Advance Payment', label: 'Advance Payment' },
];

export const TAX_CODE_OPTIONS = [
  { value: 'VAT_18', label: 'Input VAT 18%', rate: 18 },
  { value: 'VAT_10', label: 'Input VAT 10%', rate: 10 },
  { value: 'VAT_0', label: 'Zero Rated 0%', rate: 0 },
  { value: 'VAT_EXEMPT', label: 'Exempt 0%', rate: 0 },
];

export const SERVICE_TABLE_HEADERS = [
  '#',
  'VENDOR',
  'DESCRIPTION *',
  'GL CODE',
  'TOTAL (EXCLUSIVE)',
  'TAX CODE',
  'DISCOUNT %',
  'TAX AMOUNT',
  'TOTAL (INCLUSIVE)',
  'PAYMENT TERMS',
  'PROJECT',
  'PROJECT STAGE',
  'PROJECT SUB STAGE',
  'DETAIL SUB STAGE',
  'MORE DETAIL SUB STAGE',
  'ACTION',
];

// --- Validation Helpers ---

export function validateDiscountPercent(value: number): number {
  if (isNaN(value)) return 0;
  if (value > 100) {
    toast.warning('Discount Limit Exceeded', 'Discount percent cannot be more than 100%');
    return 100;
  }
  if (value < 0) {
    return 0;
  }
  return value;
}

// --- 1. ITEM CATALOG OPTION & RENDERER ---

export function formatItemCatalogOption(itm: any): SearchableSelectOption {
  const code = itm.code || itm.Code || itm.itemCode || itm.ItemCode || `ITM-${itm.id || itm.ID || ''}`;
  const name = itm.name || itm.Name || itm.itemName || itm.ItemName || 'Unnamed Item';
  const price = Number(itm.lastPurPrc || itm.price || itm.UnitPrice || 0);
  const inStock = Number(itm.onHand ?? itm.OnHand ?? itm.inStock ?? 0);
  const category = itm.categoryName || itm.CategoryName || itm.category || 'General';
  const uom = itm.uom || itm.UoM || '';

  return {
    value: code,
    label: `${code} — ${name}`,
    badge: category,
    subtext: `Category: ${category} • In Stock: ${inStock}${uom ? ' ' + uom : ''}`,
    extra: `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS`,
    raw: {
      ...itm,
      code,
      name,
      price,
      inStock,
      category,
      uom,
    },
  };
}

export const renderItemOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const itm = opt.raw || {};
  const code = itm.code || opt.value;
  const name = itm.name || opt.label;
  const price = Number(itm.price || itm.lastPurPrc || 0);
  const inStock = Number(itm.inStock ?? itm.onHand ?? 0);
  const category = itm.category || itm.categoryName || 'General';
  const uom = itm.uom || '';

  return h(
    'div',
    {
      className: `py-2.5 px-3 flex flex-col gap-1.5 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    // Row 1: Item Code badge + Name (left) and Price (right)
    h(
      'div',
      { className: 'flex items-center justify-between gap-2' },
      h(
        'div',
        { className: 'flex items-center gap-2 min-w-0' },
        h(
          'span',
          {
            className:
              'font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
          },
          code
        ),
        h(
          'span',
          { className: 'text-xs font-semibold text-slate-900 dark:text-slate-100 truncate' },
          name
        )
      ),
      h(
        'span',
        {
          className:
            'font-mono font-extrabold text-xs text-teal-600 dark:text-teal-400 shrink-0 whitespace-nowrap',
        },
        `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS`
      )
    ),
    // Row 2: Category badge & In Stock badge (Clean, no redundant price duplication)
    h(
      'div',
      { className: 'flex items-center gap-2 flex-wrap' },
      h(
        'span',
        {
          className:
            'text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
        },
        `Category: ${category}`
      ),
      h(
        'span',
        {
          className: `text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            inStock > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`,
        },
        `In Stock: ${inStock}${uom ? ` ${uom}` : ''}`
      )
    )
  );
};

// --- 2. VENDOR / SUPPLIER OPTION & RENDERER ---

export function formatVendorOption(supp: any): SearchableSelectOption {
  const code = supp.Code || supp.code || supp.cardCode || supp.CardCode || `V-${supp.id || ''}`;
  const name = supp.Name || supp.name || supp.cardName || supp.CardName || 'Unnamed Vendor';
  const tin = supp.TIN || supp.tin;
  const address = supp.Address || supp.address;
  const phone = supp.Phone || supp.phone || supp.tel || supp.Tel;
  const email = supp.Email || supp.email;
  const currency = supp.currency || supp.Currency || 'TZS';

  return {
    value: code,
    label: `${name} (${code})`,
    subtext: [tin ? `TIN: ${tin}` : '', phone ? `Tel: ${phone}` : '', address].filter(Boolean).join(' • '),
    extra: currency,
    raw: supp,
  };
}

export const renderVendorOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const supp = opt.raw || {};
  const code = supp.Code || supp.code || supp.cardCode || supp.CardCode || opt.value;
  const name = supp.Name || supp.name || supp.cardName || supp.CardName || opt.label;
  const tin = supp.TIN || supp.tin;
  const phone = supp.Phone || supp.phone || supp.tel || supp.Tel;
  const address = supp.Address || supp.address;
  const currency = supp.currency || supp.Currency;

  return h(
    'div',
    {
      className: `py-2.5 px-3 flex flex-col gap-1.5 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center justify-between gap-2' },
      h(
        'div',
        { className: 'flex items-center gap-2 min-w-0' },
        h(
          'span',
          {
            className:
              'font-mono font-bold text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0',
          },
          code
        ),
        h(
          'span',
          { className: 'text-xs font-semibold text-slate-900 dark:text-slate-100 truncate' },
          name
        )
      ),
      currency &&
        h(
          'span',
          {
            className:
              'text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
          },
          currency
        )
    ),
    (tin || phone || address) &&
      h(
        'div',
        { className: 'flex items-center gap-2 flex-wrap text-[10px] text-slate-500 dark:text-slate-400' },
        tin &&
          h(
            'span',
            {
              className:
                'px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium',
            },
            `TIN: ${tin}`
          ),
        phone && h('span', null, `Tel: ${phone}`),
        address && h('span', { className: 'truncate max-w-[220px]' }, address)
      )
  );
};

// --- 3. WAREHOUSE OPTION & RENDERER ---

export function formatWarehouseOption(wh: any): SearchableSelectOption {
  const id = wh.id ?? wh.ID;
  const code = wh.code || wh.WhsCode || wh.whsCode || (id ? `WH-${id}` : '');
  const name = wh.name || wh.WhsName || wh.whsName || 'Unnamed Warehouse';
  const location = wh.location || wh.city || '';

  return {
    value: id !== undefined && id !== null ? id : code,
    label: code && code !== name ? `${code} — ${name}` : name,
    subtext: location ? `Location: ${location}` : undefined,
    badge: 'Warehouse',
    raw: { ...wh, id, code, name },
  };
}

export const renderWarehouseOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const wh = opt.raw || {};
  const code = wh.code || wh.WhsCode || wh.whsCode || opt.value;
  const name = wh.name || wh.WhsName || wh.whsName || opt.label;
  const location = wh.location || wh.city || '';

  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center gap-2 min-w-0' },
      h(
        'span',
        {
          className:
            'font-mono font-bold text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 shrink-0',
        },
        code
      ),
      h(
        'span',
        { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
        name
      )
    ),
    h(
      'span',
      {
        className:
          'text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
      },
      location || 'Warehouse'
    )
  );
};

// --- 4. PROJECT OPTION & RENDERER ---

export function formatProjectOption(prj: any): SearchableSelectOption {
  const code = prj.code || prj.PrjCode || prj.id || '';
  const name = prj.name || prj.PrjName || 'Unnamed Project';

  return {
    value: code,
    label: `${code} — ${name}`,
    badge: 'Project',
    raw: prj,
  };
}

export const renderProjectOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const prj = opt.raw || {};
  const code = prj.code || prj.PrjCode || opt.value;
  const name = prj.name || prj.PrjName || opt.label;

  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center gap-2 min-w-0' },
      h(
        'span',
        {
          className:
            'font-mono font-bold text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0',
        },
        code
      ),
      h(
        'span',
        { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
        name
      )
    ),
    h(
      'span',
      {
        className:
          'text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0',
      },
      'Project'
    )
  );
};

// --- 5. TAX CODE OPTION & RENDERER ---

export function formatTaxCodeOption(tax: any): SearchableSelectOption {
  return {
    value: tax.value || tax.code,
    label: tax.label || tax.name,
    badge: `${tax.rate ?? 0}%`,
    raw: tax,
  };
}

export const renderTaxCodeOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const tax = opt.raw || {};
  const rate = tax.rate ?? 0;

  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center gap-2 min-w-0' },
      h(
        'span',
        {
          className:
            'font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
        },
        opt.value
      ),
      h(
        'span',
        { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
        opt.label
      )
    ),
    h(
      'span',
      {
        className:
          'font-mono font-extrabold text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 shrink-0',
      },
      `${rate}% Tax`
    )
  );
};

// --- 6. GL ACCOUNT OPTION & RENDERER ---

export function formatGLAccountOption(acc: any): SearchableSelectOption {
  const code = acc.acctCode || acc.code || acc.id || '';
  const name = acc.acctName || acc.name || 'Unnamed Account';

  return {
    value: code,
    label: `${code} — ${name}`,
    badge: 'GL',
    raw: acc,
  };
}

export const renderGLAccountOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const acc = opt.raw || {};
  const code = acc.acctCode || acc.code || opt.value;
  const name = acc.acctName || acc.name || opt.label;

  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center gap-2 min-w-0' },
      h(
        'span',
        {
          className:
            'font-mono font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0',
        },
        code
      ),
      h(
        'span',
        { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
        name
      )
    ),
    h(
      'span',
      {
        className:
          'text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0',
      },
      'G/L'
    )
  );
};

// --- 7. PAYMENT TERMS OPTION & RENDERER ---

export function formatPaymentTermOption(term: SelectOption): SearchableSelectOption {
  return {
    value: term.value,
    label: term.label,
  };
}

export const renderPaymentTermOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'span',
      { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
      opt.label
    ),
    h(
      'span',
      {
        className:
          'text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
      },
      'Terms'
    )
  );
};

// --- 8. COST CENTER / PROJECT STAGES OPTION & RENDERER ---

export function formatCostCenterOption(cc: any): SearchableSelectOption {
  const code = cc.code || cc.PrcCode || cc.id || '';
  const name = cc.name || cc.PrcName || 'Unnamed Stage';
  const dim = cc.dimCode ? `Dim ${cc.dimCode}` : '';

  return {
    value: code,
    label: `${code} — ${name}`,
    badge: dim,
    raw: cc,
  };
}

export const renderCostCenterOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const cc = opt.raw || {};
  const code = cc.code || cc.PrcCode || opt.value;
  const name = cc.name || cc.PrcName || opt.label;
  const dim = cc.dimCode ? `Dim ${cc.dimCode}` : '';

  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center gap-2 min-w-0' },
      h(
        'span',
        {
          className:
            'font-mono font-bold text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 shrink-0',
        },
        code
      ),
      h(
        'span',
        { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
        name
      )
    ),
    dim &&
      h(
        'span',
        {
          className:
            'text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
        },
        dim
      )
  );
};

// --- 9. CUSTOMER OPTION & RENDERER ---

export function formatCustomerOption(cust: any): SearchableSelectOption {
  const code = cust.Code || cust.code || cust.cardCode || cust.CardCode || `C-${cust.id || cust.ID || ''}`;
  const name = cust.Name || cust.name || cust.cardName || cust.CardName || 'Unnamed Customer';
  const tin = cust.TIN || cust.tin;
  const address = cust.Address || cust.address;
  const phone = cust.Phone || cust.phone || cust.OwnerMobileNo || cust.tel || cust.Tel;
  const currency = cust.currency || cust.Currency || 'TZS';

  return {
    value: code,
    label: `${name} (${code})`,
    subtext: [tin ? `TIN: ${tin}` : '', phone ? `Tel: ${phone}` : '', address].filter(Boolean).join(' • '),
    extra: currency,
    raw: cust,
  };
}

export const renderCustomerOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const cust = opt.raw || {};
  const code = cust.Code || cust.code || cust.cardCode || cust.CardCode || opt.value;
  const name = cust.Name || cust.name || cust.cardName || cust.CardName || opt.label;
  const tin = cust.TIN || cust.tin;
  const phone = cust.Phone || cust.phone || cust.OwnerMobileNo || cust.tel || cust.Tel;
  const address = cust.Address || cust.address;
  const currency = cust.currency || cust.Currency;

  return h(
    'div',
    {
      className: `py-2.5 px-3 flex flex-col gap-1.5 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center justify-between gap-2' },
      h(
        'div',
        { className: 'flex items-center gap-2 min-w-0' },
        h(
          'span',
          {
            className:
              'font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0',
          },
          code
        ),
        h(
          'span',
          { className: 'text-xs font-semibold text-slate-900 dark:text-slate-100 truncate' },
          name
        )
      ),
      currency &&
        h(
          'span',
          {
            className:
              'text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0',
          },
          currency
        )
    ),
    (tin || phone || address) &&
      h(
        'div',
        { className: 'flex items-center gap-2 flex-wrap text-[10px] text-slate-500 dark:text-slate-400' },
        tin &&
          h(
            'span',
            {
              className:
                'px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium',
            },
            `TIN: ${tin}`
          ),
        phone && h('span', null, `Tel: ${phone}`),
        address && h('span', { className: 'truncate max-w-[220px]' }, address)
      )
  );
};

// --- 10. BRANCH OPTION & RENDERER ---

export function formatBranchOption(b: any): SearchableSelectOption {
  const id = b.id || b.ID || '';
  const name = b.name || b.Name || `Branch #${id}`;
  const code = b.code || b.Code || '';
  const location = b.location || b.city || '';

  return {
    value: id,
    label: code ? `${code} — ${name}` : name,
    subtext: location ? `Location: ${location}` : undefined,
    badge: 'Branch',
    raw: b,
  };
}

export const renderBranchOption = (opt: SearchableSelectOption, isSelected: boolean): React.ReactNode => {
  const b = opt.raw || {};
  const id = b.id || b.ID || opt.value;
  const name = b.name || b.Name || opt.label;
  const code = b.code || b.Code;
  const location = b.location || b.city || '';

  return h(
    'div',
    {
      className: `py-2 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 font-semibold border-l-4 border-l-teal-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`,
    },
    h(
      'div',
      { className: 'flex items-center gap-2 min-w-0' },
      code &&
        h(
          'span',
          {
            className:
              'font-mono font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0',
          },
          code
        ),
      h(
        'span',
        { className: 'text-xs font-semibold text-slate-800 dark:text-slate-100 truncate' },
        name
      )
    ),
    h(
      'span',
      {
        className:
          'text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0',
      },
      location || 'Branch'
    )
  );
};
