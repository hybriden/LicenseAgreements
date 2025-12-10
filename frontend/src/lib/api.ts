// Always use /api - in production this goes through Pages Functions proxy
const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Types
export interface Category {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductType {
  id: number
  name: string
  categoryId: number
  description: string | null
  defaultBillingIntervalMonths: number
  createdAt: string
  updatedAt: string
  category?: Category
  agreements?: Agreement[]
  customerCount?: number
  totalRevenue?: number
  summary?: {
    totalCustomers: number
    totalRevenue: number
    currency: string
  }
}

export interface Customer {
  id: number
  name: string
  orgNumber: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  agreements?: Agreement[]
  activeAgreements?: Agreement[]
  inactiveAgreements?: Agreement[]
  summary?: {
    totalAgreements: number
    totalMonthlyValue: number
    totalAnnualValue: number
  }
}

export interface Agreement {
  id: number
  customerId: number
  productTypeId: number
  amount: number
  currency: string
  startDate: string
  endDate: string | null
  billingIntervalMonths: number
  nextBillingDate: string
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
  productType?: ProductType
}

export interface User {
  id: number
  azureId: string
  email: string
  displayName: string | null
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

export interface DashboardStats {
  customers: { total: number }
  productTypes: { total: number }
  agreements: { total: number; totalAnnualRevenue: number }
  categories: { total: number }
  billing: {
    upcoming: number
    upcomingTotal: number
    overdue: number
    overdueTotal: number
  }
  currency: string
}

export interface RevenueReport {
  summary: {
    totalAnnualRevenue: number
    totalAgreements: number
    currency: string
  }
  byCategory: Array<{
    name: string
    totalRevenue: number
    agreementCount: number
  }>
  byProductType: Array<{
    name: string
    category: string
    totalRevenue: number
    agreementCount: number
  }>
}

export interface BillingReport {
  summary: {
    overdueCount: number
    overdueTotal: number
    upcomingCount: number
    upcomingTotal: number
    currency: string
    periodDays: number
  }
  overdue: Agreement[]
  upcoming: Agreement[]
}

// API Functions

// Categories
export const categoriesApi = {
  getAll: () => request<Category[]>('/categories'),
  getOne: (id: number) => request<Category>(`/categories/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),
}

// Product Types
export const productTypesApi = {
  getAll: (params?: { categoryId?: number; category?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId))
    if (params?.category) searchParams.set('category', params.category)
    const query = searchParams.toString()
    return request<ProductType[]>(`/product-types${query ? `?${query}` : ''}`)
  },
  getOne: (id: number) => request<ProductType>(`/product-types/${id}`),
  create: (data: {
    name: string
    categoryId: number
    description?: string
    defaultBillingIntervalMonths?: number
  }) => request<ProductType>('/product-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<ProductType>) =>
    request<ProductType>(`/product-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/product-types/${id}`, { method: 'DELETE' }),
}

// Customers
export const customersApi = {
  getAll: (params?: { search?: string; active?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.active !== undefined) searchParams.set('active', String(params.active))
    const query = searchParams.toString()
    return request<Customer[]>(`/customers${query ? `?${query}` : ''}`)
  },
  getOne: (id: number) => request<Customer>(`/customers/${id}`),
  create: (data: {
    name: string
    orgNumber?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    address?: string | null
    notes?: string | null
  }) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE' }),
}

// Agreements
export const agreementsApi = {
  getAll: (params?: { customerId?: number; productTypeId?: number; categoryId?: number; active?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.customerId) searchParams.set('customerId', String(params.customerId))
    if (params?.productTypeId) searchParams.set('productTypeId', String(params.productTypeId))
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId))
    if (params?.active !== undefined) searchParams.set('active', String(params.active))
    const query = searchParams.toString()
    return request<Agreement[]>(`/agreements${query ? `?${query}` : ''}`)
  },
  getOne: (id: number) => request<Agreement>(`/agreements/${id}`),
  create: (data: {
    customerId: number
    productTypeId: number
    amount: number
    currency?: string
    startDate: string
    endDate?: string
    billingIntervalMonths: number
    nextBillingDate: string
    notes?: string
  }) => request<Agreement>('/agreements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Agreement>) =>
    request<Agreement>(`/agreements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/agreements/${id}`, { method: 'DELETE' }),
  markBilled: (id: number) =>
    request<Agreement>(`/agreements/${id}/bill`, { method: 'POST' }),
}

// Reports
export const reportsApi = {
  getDashboard: () => request<DashboardStats>('/reports/dashboard'),
  getRevenue: () => request<RevenueReport>('/reports/revenue'),
  getBilling: (days = 30) => request<BillingReport>(`/reports/billing?days=${days}`),
  exportAgreements: () => `${API_BASE}/reports/export?type=agreements`,
  exportCustomers: () => `${API_BASE}/reports/export?type=customers`,
}

// Users
export const usersApi = {
  getAll: () => request<User[]>('/users'),
  getMe: () => request<User>('/users/me'),
  getOne: (id: number) => request<User>(`/users/${id}`),
  updateRole: (id: number, role: string) =>
    request<User>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deactivate: (id: number) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
}
