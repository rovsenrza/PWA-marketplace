/**
 * Buyer profile. For legacy code, buyerProfile is an accessor on window:
 * reads return the current profile, and an assignment (auth.js does buyerProfile = {...})
 * replaces it with normalised fields.
 */
import type { BuyerContact, BuyerProfile } from '../../../shared/domain/types';
import { localBuyerRepository, normalizeBuyer, type BuyerRepository } from '../../../shared/data/repositories';

export class BuyerStore {
  private profile: BuyerProfile = normalizeBuyer(null);
  constructor(private readonly repo: BuyerRepository = localBuyerRepository) {}

  get(): BuyerProfile { return this.profile; }
  replace(p: unknown): void { this.profile = normalizeBuyer(p); }
  load(): void { this.profile = this.repo.load(); }
  save(): void { this.repo.save(this.profile); }

  /** After a guest checkout: fills in the missing name and phone, so «Мои заказы» finds the order. */
  rememberGuest(contact: Pick<BuyerContact, 'name' | 'phone'>): void {
    if (this.profile.name && this.profile.phone) return;
    this.profile = { ...this.profile, name: this.profile.name || contact.name, phone: this.profile.phone || contact.phone };
    this.save();
  }

  installLegacyAccessor(): void {
    Object.defineProperty(window, 'buyerProfile', {
      configurable: true,
      get: () => this.profile,
      set: (v: unknown) => this.replace(v),
    });
  }
}

export const buyerStore = new BuyerStore();
