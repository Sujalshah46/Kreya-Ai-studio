import React, { useState } from 'react';
import { KeyRound, Shield, Save, Check, Users, Lock, Search, Filter, Copy, CheckCircle2, AlertTriangle, Plus, X } from 'lucide-react';

interface RolesPermissionsViewProps {
  onNavigate?: (module: string) => void;
}

interface PermissionDef {
  key: string;
  module: string;
  action: string;
  description: string;
}

interface RoleDef {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  systemKey: string;
  permissions: string[];
}

// Permissions count: 95
const PERMISSIONS_DATA: PermissionDef[] = [
  {
    "key": "dashboard.view",
    "module": "dashboard",
    "action": "view",
    "description": "Dashboard: view"
  },
  {
    "key": "customers.view",
    "module": "customers",
    "action": "view",
    "description": "Customers: view"
  },
  {
    "key": "customers.create",
    "module": "customers",
    "action": "create",
    "description": "Customers: create"
  },
  {
    "key": "sales.discount_above_limit",
    "module": "sales",
    "action": "discount_above_limit",
    "description": "Sales orders: discount above limit"
  },
  {
    "key": "sales.cancel",
    "module": "sales",
    "action": "cancel",
    "description": "Sales orders: cancel"
  },
  {
    "key": "sales.deliver",
    "module": "sales",
    "action": "deliver",
    "description": "Sales orders: deliver"
  },
  {
    "key": "sales.print",
    "module": "sales",
    "action": "print",
    "description": "Sales orders: print"
  },
  {
    "key": "sales.view_margin",
    "module": "sales",
    "action": "view_margin",
    "description": "Sales orders: view margin"
  },
  {
    "key": "payments.collect",
    "module": "payments",
    "action": "collect",
    "description": "Payments: collect"
  },
  {
    "key": "payments.void",
    "module": "payments",
    "action": "void",
    "description": "Payments: void"
  },
  {
    "key": "payments.view",
    "module": "payments",
    "action": "view",
    "description": "Payments: view"
  },
  {
    "key": "bookings.view",
    "module": "bookings",
    "action": "view",
    "description": "Metal advance booking: view"
  },
  {
    "key": "bookings.create",
    "module": "bookings",
    "action": "create",
    "description": "Metal advance booking: create"
  },
  {
    "key": "bookings.settle",
    "module": "bookings",
    "action": "settle",
    "description": "Metal advance booking: settle"
  },
  {
    "key": "bookings.refund",
    "module": "bookings",
    "action": "refund",
    "description": "Metal advance booking: refund"
  },
  {
    "key": "buyback.view",
    "module": "buyback",
    "action": "view",
    "description": "Returns / Buy-back: view"
  },
  {
    "key": "buyback.create",
    "module": "buyback",
    "action": "create",
    "description": "Returns / Buy-back: create"
  },
  {
    "key": "repairs.view",
    "module": "repairs",
    "action": "view",
    "description": "Repairs: view"
  },
  {
    "key": "repairs.create",
    "module": "repairs",
    "action": "create",
    "description": "Repairs: create"
  },
  {
    "key": "repairs.edit",
    "module": "repairs",
    "action": "edit",
    "description": "Repairs: edit"
  },
  {
    "key": "register.open",
    "module": "register",
    "action": "open",
    "description": "Cash register: open"
  },
  {
    "key": "register.close",
    "module": "register",
    "action": "close",
    "description": "Cash register: close"
  },
  {
    "key": "register.cash_entries",
    "module": "register",
    "action": "cash_entries",
    "description": "Cash register: cash entries"
  },
  {
    "key": "register.reopen",
    "module": "register",
    "action": "reopen",
    "description": "Cash register: reopen"
  },
  {
    "key": "register.approve_difference",
    "module": "register",
    "action": "approve_difference",
    "description": "Cash register: approve difference"
  },
  {
    "key": "register.attach",
    "module": "register",
    "action": "attach",
    "description": "Cash register: attach"
  },
  {
    "key": "reports.sales",
    "module": "reports",
    "action": "sales",
    "description": "Reports: sales"
  },
  {
    "key": "reports.purchase",
    "module": "reports",
    "action": "purchase",
    "description": "Reports: purchase"
  },
  {
    "key": "reports.stock",
    "module": "reports",
    "action": "stock",
    "description": "Reports: stock"
  },
  {
    "key": "reports.margin",
    "module": "reports",
    "action": "margin",
    "description": "Reports: margin"
  },
  {
    "key": "reports.gst",
    "module": "reports",
    "action": "gst",
    "description": "Reports: gst"
  },
  {
    "key": "settings.shop",
    "module": "settings",
    "action": "shop",
    "description": "Settings: shop"
  },
  {
    "key": "settings.gst_invoice",
    "module": "settings",
    "action": "gst_invoice",
    "description": "Settings: gst invoice"
  },
  {
    "key": "settings.theme",
    "module": "settings",
    "action": "theme",
    "description": "Settings: theme"
  },
  {
    "key": "settings.login_page",
    "module": "settings",
    "action": "login_page",
    "description": "Settings: login page"
  },
  {
    "key": "settings.security",
    "module": "settings",
    "action": "security",
    "description": "Settings: security"
  },
  {
    "key": "settings.integrations",
    "module": "settings",
    "action": "integrations",
    "description": "Settings: integrations"
  },
  {
    "key": "settings.tags",
    "module": "settings",
    "action": "tags",
    "description": "Settings: tags"
  },
  {
    "key": "users.view",
    "module": "users",
    "action": "view",
    "description": "Users: view"
  },
  {
    "key": "users.create",
    "module": "users",
    "action": "create",
    "description": "Users: create"
  },
  {
    "key": "users.edit",
    "module": "users",
    "action": "edit",
    "description": "Users: edit"
  },
  {
    "key": "users.disable",
    "module": "users",
    "action": "disable",
    "description": "Users: disable"
  },
  {
    "key": "users.reset_password",
    "module": "users",
    "action": "reset_password",
    "description": "Users: reset password"
  },
  {
    "key": "roles.manage",
    "module": "roles",
    "action": "manage",
    "description": "Roles: manage"
  },
  {
    "key": "integrations.api_keys",
    "module": "integrations",
    "action": "api_keys",
    "description": "Integrations: api keys"
  },
  {
    "key": "integrations.webhooks",
    "module": "integrations",
    "action": "webhooks",
    "description": "Integrations: webhooks"
  },
  {
    "key": "logs.view_audit",
    "module": "logs",
    "action": "view_audit",
    "description": "Logs: view audit"
  },
  {
    "key": "customers.edit",
    "module": "customers",
    "action": "edit",
    "description": "Customers: edit"
  },
  {
    "key": "customers.view_kyc",
    "module": "customers",
    "action": "view_kyc",
    "description": "Customers: view kyc"
  },
  {
    "key": "customers.export",
    "module": "customers",
    "action": "export",
    "description": "Customers: export"
  },
  {
    "key": "rates.view",
    "module": "rates",
    "action": "view",
    "description": "Daily rates: view"
  },
  {
    "key": "rates.edit",
    "module": "rates",
    "action": "edit",
    "description": "Daily rates: edit"
  },
  {
    "key": "inventory.view",
    "module": "inventory",
    "action": "view",
    "description": "Inventory: view"
  },
  {
    "key": "repairs.collect",
    "module": "repairs",
    "action": "collect",
    "description": "Repairs: collect"
  },
  {
    "key": "loans.view",
    "module": "loans",
    "action": "view",
    "description": "Gold / silver loans: view"
  },
  {
    "key": "loans.create",
    "module": "loans",
    "action": "create",
    "description": "Gold / silver loans: create"
  },
  {
    "key": "loans.collect",
    "module": "loans",
    "action": "collect",
    "description": "Gold / silver loans: collect"
  },
  {
    "key": "loans.close",
    "module": "loans",
    "action": "close",
    "description": "Gold / silver loans: close"
  },
  {
    "key": "loans.waive",
    "module": "loans",
    "action": "waive",
    "description": "Gold / silver loans: waive"
  },
  {
    "key": "loans.return_item",
    "module": "loans",
    "action": "return_item",
    "description": "Gold / silver loans: return item"
  },
  {
    "key": "oldgold.view",
    "module": "oldgold",
    "action": "view",
    "description": "Old gold: view"
  },
  {
    "key": "oldgold.create",
    "module": "oldgold",
    "action": "create",
    "description": "Old gold: create"
  },
  {
    "key": "oldgold.settle",
    "module": "oldgold",
    "action": "settle",
    "description": "Old gold: settle"
  },
  {
    "key": "oldgold.undo_exchange",
    "module": "oldgold",
    "action": "undo_exchange",
    "description": "Old gold: undo exchange"
  },
  {
    "key": "metalstock.move",
    "module": "metalstock",
    "action": "move",
    "description": "Old metal stock: move"
  },
  {
    "key": "suppliers.view",
    "module": "suppliers",
    "action": "view",
    "description": "Suppliers: view"
  },
  {
    "key": "suppliers.edit",
    "module": "suppliers",
    "action": "edit",
    "description": "Suppliers: edit"
  },
  {
    "key": "suppliers.activate",
    "module": "suppliers",
    "action": "activate",
    "description": "Suppliers: activate"
  },
  {
    "key": "po.view",
    "module": "po",
    "action": "view",
    "description": "Purchase orders: view"
  },
  {
    "key": "po.create",
    "module": "po",
    "action": "create",
    "description": "Purchase orders: create"
  },
  {
    "key": "po.approve",
    "module": "po",
    "action": "approve",
    "description": "Purchase orders: approve"
  },
  {
    "key": "po.cancel_close",
    "module": "po",
    "action": "cancel_close",
    "description": "Purchase orders: cancel close"
  },
  {
    "key": "po.price_override",
    "module": "po",
    "action": "price_override",
    "description": "Purchase orders: price override"
  },
  {
    "key": "grn.post",
    "module": "grn",
    "action": "post",
    "description": "Goods receipt: post"
  },
  {
    "key": "grn.reverse",
    "module": "grn",
    "action": "reverse",
    "description": "Goods receipt: reverse"
  },
  {
    "key": "bills.view",
    "module": "bills",
    "action": "view",
    "description": "Supplier bills: view"
  },
  {
    "key": "bills.edit",
    "module": "bills",
    "action": "edit",
    "description": "Supplier bills: edit"
  },
  {
    "key": "bills.post",
    "module": "bills",
    "action": "post",
    "description": "Supplier bills: post"
  },
  {
    "key": "bills.cancel",
    "module": "bills",
    "action": "cancel",
    "description": "Supplier bills: cancel"
  },
  {
    "key": "bills.documents",
    "module": "bills",
    "action": "documents",
    "description": "Supplier bills: documents"
  },
  {
    "key": "supplier_payments.create",
    "module": "supplier_payments",
    "action": "create",
    "description": "Supplier payments: create"
  },
  {
    "key": "supplier_payments.void",
    "module": "supplier_payments",
    "action": "void",
    "description": "Supplier payments: void"
  },
  {
    "key": "logs.view_errors",
    "module": "logs",
    "action": "view_errors",
    "description": "Logs: view errors"
  },
  {
    "key": "inventory.create",
    "module": "inventory",
    "action": "create",
    "description": "Inventory: create"
  },
  {
    "key": "inventory.edit",
    "module": "inventory",
    "action": "edit",
    "description": "Inventory: edit"
  },
  {
    "key": "inventory.edit_others",
    "module": "inventory",
    "action": "edit_others",
    "description": "Inventory: edit others"
  },
  {
    "key": "inventory.adjust",
    "module": "inventory",
    "action": "adjust",
    "description": "Inventory: adjust"
  },
  {
    "key": "inventory.import",
    "module": "inventory",
    "action": "import",
    "description": "Inventory: import"
  },
  {
    "key": "inventory.view_cost",
    "module": "inventory",
    "action": "view_cost",
    "description": "Inventory: view cost"
  },
  {
    "key": "inventory.images",
    "module": "inventory",
    "action": "images",
    "description": "Inventory: images"
  },
  {
    "key": "inventory.verify",
    "module": "inventory",
    "action": "verify",
    "description": "Inventory: verify"
  },
  {
    "key": "tags.print",
    "module": "tags",
    "action": "print",
    "description": "Tags: print"
  },
  {
    "key": "sales.view",
    "module": "sales",
    "action": "view",
    "description": "Sales orders: view"
  },
  {
    "key": "sales.create",
    "module": "sales",
    "action": "create",
    "description": "Sales orders: create"
  },
  {
    "key": "sales.edit",
    "module": "sales",
    "action": "edit",
    "description": "Sales orders: edit"
  }
];
const INITIAL_ROLES_DATA: RoleDef[] = [
  {
    "id": "8",
    "name": "Viewer",
    "description": "Read-only.",
    "isSystem": true,
    "systemKey": "viewer",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "rates.view",
      "inventory.view",
      "sales.view",
      "payments.view",
      "bookings.view",
      "buyback.view",
      "repairs.view",
      "loans.view",
      "oldgold.view",
      "suppliers.view",
      "po.view",
      "bills.view",
      "users.view"
    ]
  },
  {
    "id": "1",
    "name": "Owner",
    "description": "Shop owner (Master Admin). Holds every permission. Protected.",
    "isSystem": true,
    "systemKey": "owner",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "customers.create",
      "customers.edit",
      "customers.view_kyc",
      "customers.export",
      "rates.view",
      "rates.edit",
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.edit_others",
      "inventory.adjust",
      "inventory.import",
      "inventory.view_cost",
      "inventory.images",
      "inventory.verify",
      "tags.print",
      "sales.view",
      "sales.create",
      "sales.edit",
      "sales.discount_above_limit",
      "sales.cancel",
      "sales.deliver",
      "sales.print",
      "sales.view_margin",
      "payments.collect",
      "payments.void",
      "payments.view",
      "bookings.view",
      "bookings.create",
      "bookings.settle",
      "bookings.refund",
      "buyback.view",
      "buyback.create",
      "repairs.view",
      "repairs.create",
      "repairs.edit",
      "repairs.collect",
      "loans.view",
      "loans.create",
      "loans.collect",
      "loans.close",
      "loans.waive",
      "loans.return_item",
      "oldgold.view",
      "oldgold.create",
      "oldgold.settle",
      "oldgold.undo_exchange",
      "metalstock.move",
      "suppliers.view",
      "suppliers.edit",
      "suppliers.activate",
      "po.view",
      "po.create",
      "po.approve",
      "po.cancel_close",
      "po.price_override",
      "grn.post",
      "grn.reverse",
      "bills.view",
      "bills.edit",
      "bills.post",
      "bills.cancel",
      "bills.documents",
      "supplier_payments.create",
      "supplier_payments.void",
      "register.open",
      "register.close",
      "register.cash_entries",
      "register.reopen",
      "register.approve_difference",
      "register.attach",
      "reports.sales",
      "reports.purchase",
      "reports.stock",
      "reports.margin",
      "reports.gst",
      "settings.shop",
      "settings.gst_invoice",
      "settings.theme",
      "settings.login_page",
      "settings.security",
      "settings.integrations",
      "settings.tags",
      "users.view",
      "users.create",
      "users.edit",
      "users.disable",
      "users.reset_password",
      "roles.manage",
      "integrations.api_keys",
      "integrations.webhooks",
      "logs.view_audit",
      "logs.view_errors"
    ]
  },
  {
    "id": "2",
    "name": "Admin",
    "description": "Full access to the shop, including users and settings.",
    "isSystem": true,
    "systemKey": "admin",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "customers.create",
      "customers.edit",
      "customers.view_kyc",
      "customers.export",
      "rates.view",
      "rates.edit",
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.edit_others",
      "inventory.adjust",
      "inventory.import",
      "inventory.view_cost",
      "inventory.images",
      "inventory.verify",
      "tags.print",
      "sales.view",
      "sales.create",
      "sales.edit",
      "sales.discount_above_limit",
      "sales.cancel",
      "sales.deliver",
      "sales.print",
      "sales.view_margin",
      "payments.collect",
      "payments.void",
      "payments.view",
      "bookings.view",
      "bookings.create",
      "bookings.settle",
      "bookings.refund",
      "buyback.view",
      "buyback.create",
      "repairs.view",
      "repairs.create",
      "repairs.edit",
      "repairs.collect",
      "loans.view",
      "loans.create",
      "loans.collect",
      "loans.close",
      "loans.waive",
      "loans.return_item",
      "oldgold.view",
      "oldgold.create",
      "oldgold.settle",
      "oldgold.undo_exchange",
      "metalstock.move",
      "suppliers.view",
      "suppliers.edit",
      "suppliers.activate",
      "po.view",
      "po.create",
      "po.approve",
      "po.cancel_close",
      "po.price_override",
      "grn.post",
      "grn.reverse",
      "bills.view",
      "bills.edit",
      "bills.post",
      "bills.cancel",
      "bills.documents",
      "supplier_payments.create",
      "supplier_payments.void",
      "register.open",
      "register.close",
      "register.cash_entries",
      "register.reopen",
      "register.approve_difference",
      "register.attach",
      "reports.sales",
      "reports.purchase",
      "reports.stock",
      "reports.margin",
      "reports.gst",
      "settings.shop",
      "settings.gst_invoice",
      "settings.theme",
      "settings.login_page",
      "settings.security",
      "settings.integrations",
      "settings.tags",
      "users.view",
      "users.create",
      "users.edit",
      "users.disable",
      "users.reset_password",
      "roles.manage",
      "integrations.api_keys",
      "integrations.webhooks",
      "logs.view_audit",
      "logs.view_errors"
    ]
  },
  {
    "id": "3",
    "name": "Manager",
    "description": "Runs the shop day to day. No security, integrations or role editing.",
    "isSystem": true,
    "systemKey": "manager",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "customers.create",
      "customers.edit",
      "customers.view_kyc",
      "customers.export",
      "rates.view",
      "rates.edit",
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.edit_others",
      "inventory.adjust",
      "inventory.import",
      "inventory.view_cost",
      "inventory.images",
      "inventory.verify",
      "tags.print",
      "sales.view",
      "sales.create",
      "sales.edit",
      "sales.discount_above_limit",
      "sales.cancel",
      "sales.deliver",
      "sales.print",
      "sales.view_margin",
      "payments.collect",
      "payments.void",
      "payments.view",
      "bookings.view",
      "bookings.create",
      "bookings.settle",
      "bookings.refund",
      "buyback.view",
      "buyback.create",
      "repairs.view",
      "repairs.create",
      "repairs.edit",
      "repairs.collect",
      "loans.view",
      "loans.create",
      "loans.collect",
      "loans.close",
      "loans.waive",
      "loans.return_item",
      "oldgold.view",
      "oldgold.create",
      "oldgold.settle",
      "oldgold.undo_exchange",
      "metalstock.move",
      "suppliers.view",
      "suppliers.edit",
      "suppliers.activate",
      "po.view",
      "po.create",
      "po.approve",
      "po.cancel_close",
      "po.price_override",
      "grn.post",
      "grn.reverse",
      "bills.view",
      "bills.edit",
      "bills.post",
      "bills.cancel",
      "bills.documents",
      "supplier_payments.create",
      "supplier_payments.void",
      "register.open",
      "register.close",
      "register.cash_entries",
      "register.reopen",
      "register.approve_difference",
      "register.attach",
      "reports.sales",
      "reports.purchase",
      "reports.stock",
      "reports.margin",
      "reports.gst",
      "settings.shop",
      "settings.gst_invoice",
      "settings.theme",
      "settings.login_page",
      "settings.tags",
      "users.view",
      "users.create",
      "users.edit",
      "users.disable",
      "logs.view_audit"
    ]
  },
  {
    "id": "4",
    "name": "Cashier",
    "description": "Counter billing, receipts and the cash register.",
    "isSystem": true,
    "systemKey": "cashier",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "customers.create",
      "rates.view",
      "inventory.view",
      "sales.view",
      "sales.create",
      "sales.print",
      "sales.deliver",
      "payments.collect",
      "payments.view",
      "bookings.view",
      "bookings.create",
      "repairs.view",
      "repairs.collect",
      "loans.view",
      "loans.collect",
      "loans.return_item",
      "oldgold.view",
      "register.open",
      "register.close",
      "register.cash_entries",
      "tags.print"
    ]
  },
  {
    "id": "5",
    "name": "Sales",
    "description": "Sales staff: customers, orders, bookings, repairs, old gold. (Legacy \"staff\" users get this role.)",
    "isSystem": true,
    "systemKey": "sales",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "customers.create",
      "customers.edit",
      "rates.view",
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.edit_others",
      "inventory.images",
      "inventory.verify",
      "tags.print",
      "sales.view",
      "sales.create",
      "sales.edit",
      "sales.deliver",
      "sales.print",
      "payments.collect",
      "payments.view",
      "bookings.view",
      "bookings.create",
      "bookings.settle",
      "bookings.refund",
      "buyback.view",
      "repairs.view",
      "repairs.create",
      "repairs.edit",
      "repairs.collect",
      "loans.view",
      "loans.create",
      "loans.collect",
      "loans.return_item",
      "oldgold.view",
      "oldgold.create",
      "oldgold.settle",
      "register.open",
      "register.cash_entries"
    ]
  },
  {
    "id": "6",
    "name": "Accountant",
    "description": "Views everything, runs reports and exports, handles bills and supplier payments.",
    "isSystem": true,
    "systemKey": "accountant",
    "permissions": [
      "dashboard.view",
      "customers.view",
      "rates.view",
      "inventory.view",
      "sales.view",
      "payments.view",
      "bookings.view",
      "buyback.view",
      "repairs.view",
      "loans.view",
      "oldgold.view",
      "suppliers.view",
      "po.view",
      "bills.view",
      "users.view",
      "bills.edit",
      "bills.post",
      "bills.cancel",
      "bills.documents",
      "supplier_payments.create",
      "supplier_payments.void",
      "reports.sales",
      "reports.purchase",
      "reports.stock",
      "reports.margin",
      "reports.gst",
      "customers.export",
      "inventory.view_cost",
      "sales.print",
      "sales.view_margin",
      "logs.view_audit"
    ]
  },
  {
    "id": "7",
    "name": "Stock Manager",
    "description": "Inventory only: adds stock items and edits the items he added. Items added by others open read-only.",
    "isSystem": true,
    "systemKey": "stock_manager",
    "permissions": [
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.adjust",
      "inventory.images",
      "inventory.verify",
      "tags.print"
    ]
  }
];


export const RolesPermissionsView: React.FC<RolesPermissionsViewProps> = ({ onNavigate }) => {
  const [roles, setRoles] = useState<RoleDef[]>(INITIAL_ROLES_DATA);
  const [selectedRole, setSelectedRole] = useState<RoleDef>(INITIAL_ROLES_DATA[1] || INITIAL_ROLES_DATA[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [saved, setSaved] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedRoleName, setClonedRoleName] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'matrix'>('single');

  const modules = Array.from(new Set(PERMISSIONS_DATA.map(p => p.module))).sort();

  const filteredPermissions = PERMISSIONS_DATA.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || p.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const handleTogglePermission = (roleId: string, permKey: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const hasPerm = r.permissions.includes(permKey);
      const newPerms = hasPerm 
        ? r.permissions.filter(k => k !== permKey) 
        : [...r.permissions, permKey];
      return { ...r, permissions: newPerms };
    }));

    if (selectedRole.id === roleId) {
      setSelectedRole(prev => {
        const hasPerm = prev.permissions.includes(permKey);
        const newPerms = hasPerm 
          ? prev.permissions.filter(k => k !== permKey) 
          : [...prev.permissions, permKey];
        return { ...prev, permissions: newPerms };
      });
    }
  };

  const handleCloneRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clonedRoleName.trim()) return;
    const newRole: RoleDef = {
      id: `custom-${Date.now()}`,
      name: clonedRoleName.trim(),
      description: `Custom role cloned from ${selectedRole.name}`,
      isSystem: false,
      systemKey: clonedRoleName.toLowerCase().replace(/\s+/g, '_'),
      permissions: [...selectedRole.permissions]
    };
    setRoles(prev => [...prev, newRole]);
    setSelectedRole(newRole);
    setIsCloning(false);
    setClonedRoleName('');
  };

  const handleCreateNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const newRole: RoleDef = {
      id: `custom-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom Showroom Role',
      isSystem: false,
      systemKey: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      permissions: ['dashboard.view', 'pos.view']
    };
    setRoles(prev => [...prev, newRole]);
    setSelectedRole(newRole);
    setIsCreatingRole(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      {/* Licence Banner Parity */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence expires in 30 days (15-Dec-2026). Contact Kreya IT Consulting to renew.
          </span>
        </div>
        <button 
          onClick={() => onNavigate ? onNavigate('licence') : (window.location.pathname = '/admin/license')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Roles & Permissions</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p style={{ marginTop: 4 }}>
            8 roles (Owner, Admin, Manager, Cashier, Sales, Accountant, Stock Manager, Viewer) × 95 granular permissions matrix · S.B Borana Jewellers
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="tabs" style={{ marginBottom: 0, borderBottom: "none" }}>
            <button
              onClick={() => setViewMode('single')}
              className={`tab ${viewMode === 'single' ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Role Inspector
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`tab ${viewMode === 'matrix' ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Full RBAC Matrix
            </button>
          </div>

          <button
            onClick={() => setIsCreatingRole(true)}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Create a new custom role"
          >
            <Plus size={14} />
            <span>New role</span>
          </button>

          <button
            onClick={handleSave}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            title="Save changes to role permissions"
          >
            <Save size={14} />
            <span>Save changes</span>
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: 600 }}>RBAC permissions matrix successfully saved across all active roles!</span>
        </div>
      )}

      {/* 8 Roles Navigation Strip */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r)}
            className={`tab ${selectedRole.id === r.id ? 'active' : ''}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Shield size={13} />
            <span>{r.name}</span>
            <span className="badge badge-gray" style={{ fontSize: 10, padding: "1px 6px" }}>
              {r.permissions.length}
            </span>
          </button>
        ))}
      </div>

      {viewMode === 'single' ? (
        /* SINGLE ROLE INSPECTOR VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Role Metadata Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3 md:col-span-1 h-fit">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role Profile</span>
                {selectedRole.isSystem && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                    System Role
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                {selectedRole.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {selectedRole.description}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>System Key:</span>
                <span className="font-bold text-slate-800">{selectedRole.systemKey}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Granted Rights:</span>
                <span className="font-bold text-emerald-800">{selectedRole.permissions.length} / {PERMISSIONS_DATA.length}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              {isCloning ? (
                <form onSubmit={handleCloneRole} className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">New Custom Role Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Cashier"
                    value={clonedRoleName}
                    onChange={(e) => setClonedRoleName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded py-1 text-xs font-bold"
                    >
                      Save Clone
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCloning(false)}
                      className="bg-slate-200 text-slate-700 rounded py-1 px-2.5 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCloning(true)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Clone Role to Customise</span>
                </button>
              )}
            </div>

            {selectedRole.isSystem && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 leading-normal">
                System roles are protected to preserve operational safety. Clone to tailor specific permissions.
              </p>
            )}
          </div>

          {/* Granular Permissions List */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ color: "var(--muted)" }} />
                <input
                  type="text"
                  placeholder="Search 95 permissions (e.g. view, discount, cancel, reports)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-sm"
                  style={{ width: "100%", border: "none" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Filter size={14} style={{ color: "var(--muted)" }} />
                <span className="label" style={{ margin: 0, fontSize: 12 }}>Module:</span>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="input input-sm"
                >
                  <option value="ALL">All Modules ({PERMISSIONS_DATA.length})</option>
                  {modules.map(m => (
                    <option key={m} value={m}>{m} ({PERMISSIONS_DATA.filter(p => p.module === m).length})</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Filter & Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 95 permissions (e.g. view, discount, cancel, reports)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-700">Module:</span>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium"
                >
                  <option value="ALL">All Modules ({PERMISSIONS_DATA.length})</option>
                  {modules.map(m => (
                    <option key={m} value={m}>{m} ({PERMISSIONS_DATA.filter(p => p.module === m).length})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="tbl">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">ALLOW</th>
                    <th className="py-2 px-3">PERMISSION DESCRIPTION</th>
                    <th className="py-2 px-3">SYSTEM KEY</th>
                    <th className="py-2 px-3 text-right">MODULE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPermissions.map(p => {
                    const isGranted = selectedRole.permissions.includes(p.key);
                    return (
                      <tr 
                        key={p.key} 
                        onClick={() => handleTogglePermission(selectedRole.id, p.key)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {p.description}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                          {p.key}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono font-semibold uppercase">
                            {p.module}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* FULL RBAC MATRIX VIEW */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-600" />
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                Complete Showroom Access Matrix (8 Roles × 95 Permissions)
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Click checkbox to grant or revoke</span>
          </div>

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3 sticky left-0 bg-slate-50 z-20 min-w-[240px] shadow-xs">CAPABILITY / PERMISSION</th>
                  <th className="py-2 px-2 text-center">MODULE</th>
                  {roles.map(r => (
                    <th key={r.id} className="py-2 px-2 text-center min-w-[70px]">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono">({r.permissions.length})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPermissions.map(p => (
                  <tr key={p.key} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-medium text-slate-800 sticky left-0 bg-white z-10 shadow-xs">
                      <div>{p.description}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.key}</div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-mono uppercase">
                        {p.module}
                      </span>
                    </td>
                    {roles.map(r => {
                      const hasPerm = r.permissions.includes(p.key);
                      return (
                        <td key={r.id} className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={hasPerm}
                            onChange={() => handleTogglePermission(r.id, p.key)}
                            className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW ROLE MODAL */}
      {isCreatingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Create New Role</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreatingRole(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRole} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Senior Appraiser / Valuer"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Role Description</label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Briefly describe responsibilities and authority level..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingRole(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
