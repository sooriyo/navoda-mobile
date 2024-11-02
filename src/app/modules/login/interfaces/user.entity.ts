

export interface VisitorSearchResultDTO {
  id?: number
  type: string
  company: string
  title: string
  name: string
  category: string
  plant: string
  meetingLocation: string
  boi: string
  reqDate: string
  reqTime: string
  nicNo: string
  email: string
  contactNo: string
  purpose: string
  reqBy: string
  contactPerson: string
  status: string
}


export interface VisitorDTO {
  id?: number
  type: string
  company: string
  title: string
  name: string
  category: string
  plant: string
  meetingLocation: string
  boi: string
  reqDate: string
  reqTime: string
  nicNo: string
  email: string
  contactNo: string
  purpose: string
  reqBy: string
  contactPerson: string
  status: string
  checkIn?: string
  checkOut?: string
  reason?: string
}


export interface UpdateVisitorStatusDTO {
  id?: number
  approvedBy: string
  status: string
  updatedBy: string
  reason?: string

}

export interface CategoryDTO {
  categoryId: number
  categoryName: string

}

export interface PopUpDTO {
  id: number
  status: string
}

interface ShopStats {
  pendingBalance: number;
  unpaidOrders: number;
  totalSales: number;
  pendingQuantity: number;
  cashInHand: number;
}