'use client';

import { Fragment, useEffect, useId, useState } from 'react';
import type { PropertyFormData } from '@/types/admin';
import type { Property } from '@/types/property';
import { AdminButton } from '@/components/ui/AdminButton';
import { X } from 'lucide-react';

interface PropertyFormModalProps {
  open: boolean;
  property: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
}

const TEXT_KEYS = [
  'title',
  'subtitle',
  'type',
  'location',
  'neighborhood',
  'city',
  'region',
  'country',
  'currency',
  'sale_type',
  'floor',
  'meta_description',
  'description',
  'floor_plan',
  'card_image',
] as const;

const NUMERIC_KEYS = ['rooms', 'bedrooms', 'bathrooms', 'sqmt', 'price', 'year_built'] as const;

function defaultFields(): Record<string, string> {
  const next: Record<string, string> = {};
  for (const key of TEXT_KEYS) next[key] = '';
  for (const key of NUMERIC_KEYS) next[key] = '';
  next.currency = 'EUR';
  return next;
}

function toStr(value: unknown): string {
  return value == null ? '' : String(value);
}

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-[44px]';
const errorBorderClass = ' border-red-500 dark:border-red-500';
const errorTextClass = 'mt-1 text-sm text-red-600 dark:text-red-400';
const hintClass = 'mt-1 text-xs text-gray-500 dark:text-gray-400';
const fileInputClass =
  'mt-1 block w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

interface ShortField {
  name: string;
  label: string;
}

const SHORT_ROWS: Array<[ShortField, ShortField | 'parking']> = [
  [{ name: 'title', label: 'Title *' }, { name: 'type', label: 'Type' }],
  [{ name: 'subtitle', label: 'Subtitle' }, { name: 'sale_type', label: 'Sale type' }],
  [{ name: 'location', label: 'Location' }, { name: 'neighborhood', label: 'Neighborhood' }],
  [{ name: 'city', label: 'City' }, { name: 'region', label: 'Region' }],
  [{ name: 'country', label: 'Country' }, { name: 'currency', label: 'Currency' }],
  [{ name: 'price', label: 'Price' }, { name: 'sqmt', label: 'Sqmt' }],
  [{ name: 'rooms', label: 'Rooms' }, { name: 'bedrooms', label: 'Bedrooms' }],
  [{ name: 'bathrooms', label: 'Bathrooms' }, { name: 'year_built', label: 'Year built' }],
  [{ name: 'floor', label: 'Floor' }, 'parking'],
  [{ name: 'coordsLat', label: 'Latitude' }, { name: 'coordsLng', label: 'Longitude' }],
];

const VALIDATION_ORDER = [
  'title',
  'price',
  'sqmt',
  'rooms',
  'bedrooms',
  'bathrooms',
  'year_built',
  'coordsLat',
  'coordsLng',
] as const;

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem('admin_token');
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error('Network request failed.');
  }
  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new Error('Unexpected server response.');
  }
  if (!res.ok) {
    throw new Error(
      (parsed as { error?: string }).error || res.statusText || `Request failed (${res.status})`,
    );
  }
  return parsed as T;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file.'));
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function PropertyFormModal({ open, property, onClose, onSaved }: PropertyFormModalProps) {
  const [fields, setFields] = useState<Record<string, string>>(defaultFields);
  const [parking, setParking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const baseId = useId();
  const titleId = useId();

  const fieldId = (name: string) => `${baseId}-${name}`;
  const getValue = (name: string) => fields[name] ?? '';
  const setField = (name: string, value: string) =>
    setFields((prev) => ({ ...prev, [name]: value }));

  useEffect(() => {
    if (!open) return;
    const next = defaultFields();
    if (property) {
      next.title = property.title;
      next.subtitle = toStr(property.subtitle);
      next.type = toStr(property.type);
      next.location = toStr(property.location);
      next.neighborhood = toStr(property.neighborhood);
      next.city = toStr(property.city);
      next.region = toStr(property.region);
      next.country = toStr(property.country);
      next.currency = toStr(property.currency) || 'EUR';
      next.sale_type = toStr(property.sale_type);
      next.floor = toStr(property.floor);
      next.meta_description = toStr(property.meta_description);
      next.description = toStr(property.description);
      next.floor_plan = toStr(property.floor_plan);
      next.card_image = toStr(property.card_image);
      next.rooms = toStr(property.rooms);
      next.bedrooms = toStr(property.bedrooms);
      next.bathrooms = toStr(property.bathrooms);
      next.sqmt = toStr(property.sqmt);
      next.price = toStr(property.price);
      next.year_built = toStr(property.year_built);
      next.coordsLat = property.coords ? toStr(property.coords[0]) : '';
      next.coordsLng = property.coords ? toStr(property.coords[1]) : '';
      next.inclusionsText = property.inclusions?.join('\n') ?? '';
      next.galleryText = property.gallery?.join('\n') ?? '';
    }
    const t = setTimeout(() => {
      setFields(next);
      setParking(property?.parking === true);
      setErrors({});
      setFormError(null);
      setSubmitting(false);
    }, 0);
    return () => clearTimeout(t);
  }, [open, property]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (getValue('title').trim() === '') {
      nextErrors.title = 'Title is required.';
    }
    const numericKeys: string[] = [...NUMERIC_KEYS, 'coordsLat', 'coordsLng'];
    for (const key of numericKeys) {
      const raw = getValue(key).trim();
      if (raw === '') continue;
      if (!Number.isFinite(Number(raw))) {
        nextErrors[key] = 'Must be a number.';
      }
    }
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = VALIDATION_ORDER.find((key) => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    const payload: PropertyFormData = {
      title: getValue('title').trim(),
      parking,
    };

    const textValue = (key: string) => {
      const value = getValue(key).trim();
      return value === '' ? undefined : value;
    };
    const assignOptionalText = <K extends keyof PropertyFormData>(
      key: K,
      value: PropertyFormData[K] | undefined,
    ) => {
      if (value !== undefined) payload[key] = value;
    };

    assignOptionalText('subtitle', textValue('subtitle'));
    assignOptionalText('type', textValue('type'));
    assignOptionalText('location', textValue('location'));
    assignOptionalText('neighborhood', textValue('neighborhood'));
    assignOptionalText('city', textValue('city'));
    assignOptionalText('region', textValue('region'));
    assignOptionalText('country', textValue('country'));
    assignOptionalText('currency', textValue('currency'));
    assignOptionalText('sale_type', textValue('sale_type'));
    assignOptionalText('floor', textValue('floor'));
    assignOptionalText('meta_description', textValue('meta_description'));
    assignOptionalText('description', textValue('description'));
    assignOptionalText('floor_plan', textValue('floor_plan'));
    assignOptionalText('card_image', textValue('card_image'));

    for (const key of NUMERIC_KEYS) {
      const raw = getValue(key).trim();
      if (raw !== '') payload[key] = Number(raw);
    }

    const latRaw = getValue('coordsLat').trim();
    const lngRaw = getValue('coordsLng').trim();
    if (latRaw !== '' && lngRaw !== '') {
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng)) payload.coords = [lat, lng];
    }

    const inclusions = getValue('inclusionsText')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (inclusions.length > 0) payload.inclusions = inclusions;

    const gallery = getValue('galleryText')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (gallery.length > 0) payload.gallery = gallery;

    setSubmitting(true);
    setFormError(null);
    try {
      const data = await adminFetch<{ property: Property }>('/api/admin/properties', {
        method: property ? 'PUT' : 'POST',
        body: JSON.stringify(property ? { id: property.id, ...payload } : payload),
      });
      onSaved(data.property);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleImage = (files: FileList | null, key: 'card_image' | 'floor_plan') => {
    const file = files?.[0];
    if (!file) return;
    void readFileAsDataUrl(file)
      .then((dataUrl) => setField(key, dataUrl))
      .catch(() => setFormError('Failed to read the selected image.'));
  };

  const handleGalleryFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    void Promise.all(Array.from(files, readFileAsDataUrl))
      .then((dataUrls) => {
        setFields((prev) => {
          const existing = prev.galleryText ?? '';
          const combined = existing
            ? `${existing}\n${dataUrls.join('\n')}`
            : dataUrls.join('\n');
          return { ...prev, galleryText: combined };
        });
      })
      .catch(() => setFormError('Failed to read one or more selected images.'));
  };

  const renderTextInput = (field: ShortField) => {
    const id = fieldId(field.name);
    const error = errors[field.name];
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {field.label}
        </label>
        <input
          id={id}
          type="text"
          value={getValue(field.name)}
          onChange={(e) => setField(field.name, e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${inputClass}${error ? errorBorderClass : ''}`}
        />
        {error ? <p className={errorTextClass}>{error}</p> : null}
      </div>
    );
  };

  const renderTextarea = (name: string, label: string, rows: number, hint?: string) => {
    const id = fieldId(name);
    const error = errors[name];
    return (
      <div className="col-span-2">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <textarea
          id={id}
          rows={rows}
          value={getValue(name)}
          onChange={(e) => setField(name, e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${inputClass}${error ? errorBorderClass : ''}`}
        />
        {error ? <p className={errorTextClass}>{error}</p> : null}
        {hint ? <p className={hintClass}>{hint}</p> : null}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {property ? 'Edit property' : 'Add property'}
          </h2>
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-5 w-5" aria-hidden="true"/>
          </AdminButton>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SHORT_ROWS.map(([left, right]) => (
              <Fragment key={left.name}>
                {renderTextInput(left)}
                {right === 'parking' ? (
                  <div className="flex items-end pb-2">
                    <label
                      htmlFor={fieldId('parking')}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <input
                        id={fieldId('parking')}
                        type="checkbox"
                        checked={parking}
                        onChange={(e) => setParking(e.target.checked)}
                        className="h-5 w-5 cursor-pointer accent-brand-600 dark:accent-brand-500"
                      />
                      Parking available
                    </label>
                  </div>
                ) : (
                  renderTextInput(right)
                )}
              </Fragment>
            ))}

            {renderTextarea('description', 'Description', 3)}
            {renderTextarea('meta_description', 'Meta description', 3)}
            {renderTextarea('inclusionsText', 'Inclusions', 4, 'One per line')}
            {renderTextarea('galleryText', 'Gallery URLs', 4, 'One URL per line')}

            <div className="col-span-2">
              <label htmlFor={fieldId('card_image')} className={labelClass}>
                Card image
              </label>
              <input
                id={fieldId('card_image')}
                type="text"
                value={getValue('card_image')}
                onChange={(e) => setField('card_image', e.target.value)}
                className={inputClass}
              />
              <label
                htmlFor={fieldId('card_image_file')}
                className="mt-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Upload image file
              </label>
              <input
                id={fieldId('card_image_file')}
                type="file"
                accept="image/*"
                className={fileInputClass}
                onChange={(e) => handleSingleImage(e.target.files, 'card_image')}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor={fieldId('floor_plan')} className={labelClass}>
                Floor plan
              </label>
              <input
                id={fieldId('floor_plan')}
                type="text"
                value={getValue('floor_plan')}
                onChange={(e) => setField('floor_plan', e.target.value)}
                className={inputClass}
              />
              <label
                htmlFor={fieldId('floor_plan_file')}
                className="mt-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Upload image file
              </label>
              <input
                id={fieldId('floor_plan_file')}
                type="file"
                accept="image/*"
                className={fileInputClass}
                onChange={(e) => handleSingleImage(e.target.files, 'floor_plan')}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor={fieldId('gallery_files')} className={labelClass}>
                Gallery images
              </label>
              <input
                id={fieldId('gallery_files')}
                type="file"
                accept="image/*"
                multiple
                className={fileInputClass}
                onChange={(e) => handleGalleryFiles(e.target.files)}
              />
            </div>
          </div>

          <div aria-live="polite" className="mt-4">
            {formError ? <p className={errorTextClass}>{formError}</p> : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <AdminButton
              variant="secondary"
              type="button"
              onClick={onClose}
              className="min-h-[44px]"
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              type="submit"
              disabled={submitting}
              className="min-h-[44px]"
            >
              {submitting ? 'Saving…' : 'Save'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
