import { getTenant, localized } from '@/lib/tenant';

function money(amount: number, currency: string): string {
  const grouped = amount.toLocaleString('ru-RU'); // space thousands separators
  return currency === 'UZS' ? `${grouped} so'm` : `${grouped} ${currency}`;
}

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']; // Mon..Sun (ISO 1..7)

export default async function TenantPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);

  if (!tenant) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Topilmadi</h1>
          <p className="mt-2 text-neutral-500">Bunday sahifa mavjud emas.</p>
          <a href="https://bookup.uz" className="mt-4 inline-block font-semibold text-[#f4495b]">
            bookup.uz ga o&apos;tish
          </a>
        </div>
      </main>
    );
  }

  const { business, branches, services } = tenant;
  const branch = branches[0];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-2xl px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          {business.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.avatarUrl}
              alt={business.name}
              width={64}
              height={64}
              className="size-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid size-16 place-items-center rounded-2xl bg-[#f4495b] text-2xl font-extrabold text-white">
              {business.name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold">{business.name}</h1>
            {business.category && (
              <p className="text-sm text-neutral-500">{localized(business.category.name)}</p>
            )}
          </div>
        </div>

        {/* Address + hours */}
        {branch && (
          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            {branch.address && (
              <p className="text-sm text-neutral-700">{localized(branch.address)}</p>
            )}
            {branch.workingHours.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
                {branch.workingHours.map((w) => (
                  <div key={w.weekday} className="flex justify-between text-neutral-600">
                    <span>{WEEKDAYS[w.weekday - 1] ?? w.weekday}</span>
                    <span className="tabular-nums">
                      {w.isDayOff || !w.openTime || !w.closeTime
                        ? 'Dam olish'
                        : `${w.openTime.slice(0, 5)}–${w.closeTime.slice(0, 5)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services */}
        <h2 className="mt-8 text-xs font-bold uppercase tracking-wide text-neutral-400">
          Xizmatlar
        </h2>
        {services.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Hozircha xizmatlar yo&apos;q.</p>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
            {services.map((s, i) => {
              const priceLabel =
                s.pricingMode === 'time_rate'
                  ? s.ratePerHour != null
                    ? `${money(s.ratePerHour, business.currency)}/soat`
                    : ''
                  : s.price != null
                    ? money(s.price, business.currency)
                    : '';
              return (
                <li
                  key={s.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-100' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{localized(s.name)}</p>
                    {s.durationMinutes != null && (
                      <p className="text-xs text-neutral-400">{s.durationMinutes} daqiqa</p>
                    )}
                  </div>
                  {priceLabel && (
                    <span className="shrink-0 font-bold tabular-nums">{priceLabel}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-10 text-center text-xs text-neutral-400">
          <a href="https://bookup.uz" className="font-semibold text-neutral-500">
            bookup.uz
          </a>{' '}
          orqali
        </p>
      </div>
    </main>
  );
}
