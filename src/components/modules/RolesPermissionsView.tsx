import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Save, Search, Lock, Copy, Trash2, Check } from 'lucide-react';

interface RolesPermissionsViewProps {
  onNavigate?: (module: string) => void;
}

interface PermissionItem {
  key: string;
  action: string;
  description: string;
}

interface ModulePermissions {
  module: string;
  label: string;
  permissions: PermissionItem[];
}

interface RoleItem {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  system_key: string;
  row_version: number;
  permissions: string[];
  users: number;
}

const ALL_MODULES_PERMISSIONS: ModulePermissions[] = [
  {
    module: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", action: "view", description: "Dashboard: view" }]
  },
  {
    module: "customers",
    label: "Customers",
    permissions: [
      { key: "customers.view", action: "view", description: "Customers: view" },
      { key: "customers.create", action: "create", description: "Customers: create" },
      { key: "customers.edit", action: "edit", description: "Customers: edit" },
      { key: "customers.view_kyc", action: "view_kyc", description: "Customers: view kyc" },
      { key: "customers.export", action: "export", description: "Customers: export" }
    ]
  },
  {
    module: "rates",
    label: "Daily rates",
    permissions: [
      { key: "rates.view", action: "view", description: "Daily rates: view" },
      { key: "rates.edit", action: "edit", description: "Daily rates: edit" }
    ]
  },
  {
    module: "inventory",
    label: "Inventory",
    permissions: [
      { key: "inventory.view", action: "view", description: "Inventory: view" },
      { key: "inventory.create", action: "create", description: "Inventory: create" },
      { key: "inventory.edit", action: "edit", description: "Inventory: edit" },
      { key: "inventory.edit_others", action: "edit_others", description: "Inventory: edit others" },
      { key: "inventory.adjust", action: "adjust", description: "Inventory: adjust" },
      { key: "inventory.import", action: "import", description: "Inventory: import" },
      { key: "inventory.view_cost", action: "view_cost", description: "Inventory: view cost" },
      { key: "inventory.images", action: "images", description: "Inventory: images" },
      { key: "inventory.verify", action: "verify", description: "Inventory: verify" }
    ]
  },
  {
    module: "tags",
    label: "Tags",
    permissions: [{ key: "tags.print", action: "print", description: "Tags: print" }]
  },
  {
    module: "sales",
    label: "Sales orders",
    permissions: [
      { key: "sales.view", action: "view", description: "Sales orders: view" },
      { key: "sales.create", action: "create", description: "Sales orders: create" },
      { key: "sales.edit", action: "edit", description: "Sales orders: edit" },
      { key: "sales.discount_above_limit", action: "discount_above_limit", description: "Sales orders: discount above limit" },
      { key: "sales.cancel", action: "cancel", description: "Sales orders: cancel" },
      { key: "sales.deliver", action: "deliver", description: "Sales orders: deliver" },
      { key: "sales.print", action: "print", description: "Sales orders: print" },
      { key: "sales.view_margin", action: "view_margin", description: "Sales orders: view margin" }
    ]
  },
  {
    module: "payments",
    label: "Payments",
    permissions: [
      { key: "payments.view", action: "view", description: "Payments: view" },
      { key: "payments.collect", action: "collect", description: "Payments: collect" },
      { key: "payments.void", action: "void", description: "Payments: void" }
    ]
  },
  {
    module: "bookings",
    label: "Metal advance booking",
    permissions: [
      { key: "bookings.view", action: "view", description: "Metal advance booking: view" },
      { key: "bookings.create", action: "create", description: "Metal advance booking: create" },
      { key: "bookings.settle", action: "settle", description: "Metal advance booking: settle" },
      { key: "bookings.refund", action: "refund", description: "Metal advance booking: refund" }
    ]
  },
  {
    module: "buyback",
    label: "Returns / Buy-back",
    permissions: [
      { key: "buyback.view", action: "view", description: "Returns / Buy-back: view" },
      { key: "buyback.create", action: "create", description: "Returns / Buy-back: create" }
    ]
  },
  {
    module: "repairs",
    label: "Repairs",
    permissions: [
      { key: "repairs.view", action: "view", description: "Repairs: view" },
      { key: "repairs.create", action: "create", description: "Repairs: create" },
      { key: "repairs.edit", action: "edit", description: "Repairs: edit" },
      { key: "repairs.collect", action: "collect", description: "Repairs: collect" }
    ]
  },
  {
    module: "loans",
    label: "Gold / silver loans",
    permissions: [
      { key: "loans.view", action: "view", description: "Gold / silver loans: view" },
      { key: "loans.create", action: "create", description: "Gold / silver loans: create" },
      { key: "loans.collect", action: "collect", description: "Gold / silver loans: collect" },
      { key: "loans.return_item", action: "return_item", description: "Gold / silver loans: return item" },
      { key: "loans.close", action: "close", description: "Gold / silver loans: close" },
      { key: "loans.waive", action: "waive", description: "Gold / silver loans: waive" }
    ]
  },
  {
    module: "oldgold",
    label: "Old gold",
    permissions: [
      { key: "oldgold.view", action: "view", description: "Old gold: view" },
      { key: "oldgold.create", action: "create", description: "Old gold: create" },
      { key: "oldgold.settle", action: "settle", description: "Old gold: settle" },
      { key: "oldgold.undo_exchange", action: "undo_exchange", description: "Old gold: undo exchange" }
    ]
  },
  {
    module: "metalstock",
    label: "Old metal stock",
    permissions: [{ key: "metalstock.move", action: "move", description: "Old metal stock: move" }]
  },
  {
    module: "suppliers",
    label: "Suppliers",
    permissions: [
      { key: "suppliers.view", action: "view", description: "Suppliers: view" },
      { key: "suppliers.edit", action: "edit", description: "Suppliers: edit" },
      { key: "suppliers.activate", action: "activate", description: "Suppliers: activate" }
    ]
  },
  {
    module: "po",
    label: "Purchase orders",
    permissions: [
      { key: "po.view", action: "view", description: "Purchase orders: view" },
      { key: "po.create", action: "create", description: "Purchase orders: create" },
      { key: "po.approve", action: "approve", description: "Purchase orders: approve" },
      { key: "po.price_override", action: "price_override", description: "Purchase orders: price override" },
      { key: "po.cancel_close", action: "cancel_close", description: "Purchase orders: cancel close" }
    ]
  },
  {
    module: "grn",
    label: "Goods receipt",
    permissions: [
      { key: "grn.post", action: "post", description: "Goods receipt: post" },
      { key: "grn.reverse", action: "reverse", description: "Goods receipt: reverse" }
    ]
  },
  {
    module: "bills",
    label: "Supplier bills",
    permissions: [
      { key: "bills.view", action: "view", description: "Supplier bills: view" },
      { key: "bills.post", action: "post", description: "Supplier bills: post" },
      { key: "bills.edit", action: "edit", description: "Supplier bills: edit" },
      { key: "bills.cancel", action: "cancel", description: "Supplier bills: cancel" },
      { key: "bills.documents", action: "documents", description: "Supplier bills: documents" }
    ]
  },
  {
    module: "supplier_payments",
    label: "Supplier payments",
    permissions: [
      { key: "supplier_payments.create", action: "create", description: "Supplier payments: create" },
      { key: "supplier_payments.void", action: "void", description: "Supplier payments: void" }
    ]
  },
  {
    module: "register",
    label: "Cash register",
    permissions: [
      { key: "register.open", action: "open", description: "Cash register: open" },
      { key: "register.close", action: "close", description: "Cash register: close" },
      { key: "register.reopen", action: "reopen", description: "Cash register: reopen" },
      { key: "register.cash_entries", action: "cash_entries", description: "Cash register: cash entries" },
      { key: "register.attach", action: "attach", description: "Cash register: attach" },
      { key: "register.approve_difference", action: "approve_difference", description: "Cash register: approve difference" }
    ]
  },
  {
    module: "reports",
    label: "Reports",
    permissions: [
      { key: "reports.sales", action: "sales", description: "Reports: sales" },
      { key: "reports.margin", action: "margin", description: "Reports: margin" },
      { key: "reports.stock", action: "stock", description: "Reports: stock" },
      { key: "reports.gst", action: "gst", description: "Reports: gst" },
      { key: "reports.purchase", action: "purchase", description: "Reports: purchase" }
    ]
  },
  {
    module: "settings",
    label: "Settings",
    permissions: [
      { key: "settings.shop", action: "shop", description: "Settings: shop" },
      { key: "settings.gst_invoice", action: "gst_invoice", description: "Settings: gst invoice" },
      { key: "settings.tags", action: "tags", description: "Settings: tags" },
      { key: "settings.theme", action: "theme", description: "Settings: theme" },
      { key: "settings.login_page", action: "login_page", description: "Settings: login page" },
      { key: "settings.security", action: "security", description: "Settings: security" },
      { key: "settings.integrations", action: "integrations", description: "Settings: integrations" }
    ]
  },
  {
    module: "users",
    label: "Users",
    permissions: [
      { key: "users.view", action: "view", description: "Users: view" },
      { key: "users.create", action: "create", description: "Users: create" },
      { key: "users.edit", action: "edit", description: "Users: edit" },
      { key: "users.disable", action: "disable", description: "Users: disable" },
      { key: "users.reset_password", action: "reset_password", description: "Users: reset password" }
    ]
  },
  {
    module: "roles",
    label: "Roles",
    permissions: [{ key: "roles.manage", action: "manage", description: "Roles: manage" }]
  },
  {
    module: "integrations",
    label: "Integrations",
    permissions: [
      { key: "integrations.api_keys", action: "api_keys", description: "Integrations: api keys" },
      { key: "integrations.webhooks", action: "webhooks", description: "Integrations: webhooks" }
    ]
  },
  {
    module: "logs",
    label: "Logs",
    permissions: [
      { key: "logs.view_audit", action: "view_audit", description: "Logs: view audit" },
      { key: "logs.view_errors", action: "view_errors", description: "Logs: view errors" }
    ]
  }
];

const INITIAL_ROLES: RoleItem[] = [
  {
    id: 1,
    name: "Owner",
    description: "Shop owner (Master Admin). Holds every permission. Protected.",
    is_system: true,
    system_key: "owner",
    row_version: 1,
    permissions: ALL_MODULES_PERMISSIONS.flatMap(m => m.permissions.map(p => p.key)),
    users: 1
  },
  {
    id: 2,
    name: "Admin",
    description: "Full access to the shop, including users and settings.",
    is_system: true,
    system_key: "admin",
    row_version: 1,
    permissions: ALL_MODULES_PERMISSIONS.flatMap(m => m.permissions.map(p => p.key)),
    users: 1
  },
  {
    id: 3,
    name: "Manager",
    description: "Runs the shop day to day. No security, integrations or role editing.",
    is_system: true,
    system_key: "manager",
    row_version: 1,
    permissions: [
      "bills.cancel","bills.documents","bills.edit","bills.post","bills.view","bookings.create","bookings.refund","bookings.settle","bookings.view","buyback.create","buyback.view","customers.create","customers.edit","customers.export","customers.view","customers.view_kyc","dashboard.view","grn.post","grn.reverse","inventory.adjust","inventory.create","inventory.edit","inventory.edit_others","inventory.images","inventory.import","inventory.verify","inventory.view","inventory.view_cost","loans.close","loans.collect","loans.create","loans.return_item","loans.view","loans.waive","logs.view_audit","metalstock.move","oldgold.create","oldgold.settle","oldgold.undo_exchange","oldgold.view","payments.collect","payments.view","payments.void","po.approve","po.cancel_close","po.create","po.price_override","po.view","rates.edit","rates.view","register.approve_difference","register.attach","register.cash_entries","register.close","register.open","register.reopen","repairs.collect","repairs.create","repairs.edit","repairs.view","reports.gst","reports.margin","reports.purchase","reports.sales","reports.stock","sales.cancel","sales.create","sales.deliver","sales.discount_above_limit","sales.edit","sales.print","sales.view","sales.view_margin","settings.gst_invoice","settings.login_page","settings.shop","settings.tags","settings.theme","supplier_payments.create","supplier_payments.void","suppliers.activate","suppliers.edit","suppliers.view","tags.print","users.create","users.disable","users.edit","users.view"
    ],
    users: 0
  },
  {
    id: 4,
    name: "Cashier",
    description: "Counter billing, receipts and the cash register.",
    is_system: true,
    system_key: "cashier",
    row_version: 1,
    permissions: [
      "bookings.create","bookings.view","customers.create","customers.view","dashboard.view","inventory.view","loans.collect","loans.return_item","loans.view","oldgold.view","payments.collect","payments.view","rates.view","register.cash_entries","register.close","register.open","repairs.collect","repairs.view","sales.create","sales.deliver","sales.print","sales.view","tags.print"
    ],
    users: 1
  },
  {
    id: 5,
    name: "Sales",
    description: "Sales staff: customers, orders, bookings, repairs, old gold. (Legacy \"staff\" users get this role.)",
    is_system: true,
    system_key: "sales",
    row_version: 1,
    permissions: [
      "bookings.create","bookings.refund","bookings.settle","bookings.view","buyback.view","customers.create","customers.edit","customers.view","dashboard.view","inventory.create","inventory.edit","inventory.edit_others","inventory.images","inventory.verify","inventory.view","loans.collect","loans.create","loans.return_item","loans.view","oldgold.create","oldgold.settle","oldgold.view","payments.collect","payments.view","rates.view","register.cash_entries","register.open","repairs.collect","repairs.create","repairs.edit","repairs.view","sales.create","sales.deliver","sales.edit","sales.print","sales.view","tags.print"
    ],
    users: 1
  },
  {
    id: 6,
    name: "Accountant",
    description: "Views everything, runs reports and exports, handles bills and supplier payments.",
    is_system: true,
    system_key: "accountant",
    row_version: 1,
    permissions: [
      "bills.cancel","bills.documents","bills.edit","bills.post","bills.view","bookings.view","buyback.view","customers.export","customers.view","dashboard.view","inventory.view","inventory.view_cost","loans.view","logs.view_audit","oldgold.view","payments.view","po.view","rates.view","repairs.view","reports.gst","reports.margin","reports.purchase","reports.sales","reports.stock","sales.print","sales.view","sales.view_margin","supplier_payments.create","supplier_payments.void","suppliers.view","users.view"
    ],
    users: 1
  },
  {
    id: 8,
    name: "Viewer",
    description: "Read-only.",
    is_system: true,
    system_key: "viewer",
    row_version: 1,
    permissions: [
      "bills.view","bookings.view","buyback.view","customers.view","dashboard.view","inventory.view","loans.view","oldgold.view","payments.view","po.view","rates.view","repairs.view","sales.view","suppliers.view","users.view"
    ],
    users: 1
  },
  {
    id: 7,
    name: "Stock Manager",
    description: "Inventory only: adds stock items and edits the items he added. Items added by others open read-only.",
    is_system: true,
    system_key: "stock_manager",
    row_version: 1,
    permissions: [
      "inventory.adjust","inventory.create","inventory.edit","inventory.images","inventory.verify","inventory.view","tags.print"
    ],
    users: 0
  }
];

export const RolesPermissionsView: React.FC<RolesPermissionsViewProps> = ({ onNavigate }) => {
  const [roles, setRoles] = useState<RoleItem[]>(INITIAL_ROLES);
  const [search, setSearch] = useState('');
  const [pendingChanges, setPendingChanges] = useState<{ [roleId: number]: Set<string> }>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // The Owner is not shown in the columns
  const visibleRoles = useMemo(() => {
    return roles.filter(r => r.system_key !== 'owner');
  }, [roles]);

  const getRolePerms = (role: RoleItem): Set<string> => {
    return pendingChanges[role.id] || new Set(role.permissions);
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const filteredModules = useMemo(() => {
    if (!search.trim()) return ALL_MODULES_PERMISSIONS;
    const q = search.toLowerCase().trim();
    return ALL_MODULES_PERMISSIONS.map(m => ({
      ...m,
      permissions: m.permissions.filter(p => 
        p.description.toLowerCase().includes(q) || 
        p.key.toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q)
      )
    })).filter(m => m.permissions.length > 0);
  }, [search]);

  const handleToggleRolePerm = (role: RoleItem, permKey: string) => {
    if (role.is_system) return;
    const current = new Set(getRolePerms(role));
    if (current.has(permKey)) {
      current.delete(permKey);
    } else {
      current.add(permKey);
    }
    setPendingChanges(prev => ({
      ...prev,
      [role.id]: current
    }));
  };

  const handleToggleModuleForRole = (role: RoleItem, mod: ModulePermissions) => {
    if (role.is_system) return;
    const current = new Set(getRolePerms(role));
    const modPermKeys = mod.permissions.map(p => p.key);
    const allPresent = modPermKeys.every(k => current.has(k));

    if (allPresent) {
      modPermKeys.forEach(k => current.delete(k));
    } else {
      modPermKeys.forEach(k => current.add(k));
    }

    setPendingChanges(prev => ({
      ...prev,
      [role.id]: current
    }));
  };

  const handleNewRole = () => {
    const roleName = window.prompt("Name for the new role (e.g. Senior Cashier)");
    if (!roleName || !roleName.trim()) return;

    const newRole: RoleItem = {
      id: Date.now(),
      name: roleName.trim(),
      description: `Custom role: ${roleName.trim()}`,
      is_system: false,
      system_key: roleName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      row_version: 1,
      permissions: ['dashboard.view'],
      users: 0
    };

    setRoles(prev => [...prev, newRole]);
    showToast("Role created — tick its permissions");
  };

  const handleCloneRole = (role: RoleItem) => {
    const newName = window.prompt("Name for the new role", `${role.name} (custom)`);
    if (!newName || !newName.trim()) return;

    const cloned: RoleItem = {
      id: Date.now(),
      name: newName.trim(),
      description: `Custom role cloned from ${role.name}`,
      is_system: false,
      system_key: newName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      row_version: 1,
      permissions: [...getRolePerms(role)],
      users: 0
    };

    setRoles(prev => [...prev, cloned]);
    showToast("Role created");
  };

  const handleDeleteRole = (role: RoleItem) => {
    if (role.is_system) return;
    if (!window.confirm(`Delete role "${role.name}"?`)) return;

    setRoles(prev => prev.filter(r => r.id !== role.id));
    setPendingChanges(prev => {
      const copy = { ...prev };
      delete copy[role.id];
      return copy;
    });
    showToast("Role deleted");
  };

  const handleSaveChanges = () => {
    setSaving(true);
    setTimeout(() => {
      setRoles(prev => prev.map(r => {
        if (pendingChanges[r.id]) {
          return {
            ...r,
            permissions: Array.from(pendingChanges[r.id]),
            row_version: r.row_version + 1
          };
        }
        return r;
      }));
      setPendingChanges({});
      setSaving(false);
      showToast("Permissions saved. Users get the change within a few seconds.");
    }, 500);
  };

  return (
    <div className="page" id="main">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="kj-toast" 
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 8,
            boxShadow: 'var(--sh-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <Check size={16} style={{ color: 'var(--primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Roles & Permissions</h1>
          <p>Tick what each role may do. System roles are read-only — clone one to customise it.</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={handleNewRole}>
            <Plus size={14} /> New role
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveChanges} 
            disabled={!hasChanges || saving}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Search Row */}
      <div className="search-row">
        <div className="search-box">
          <Search size={14} />
          <input 
            placeholder="Find a permission…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <span className="helper">
          The Owner always has every permission and is not shown.
        </span>
      </div>

      {/* RBAC Matrix Card */}
      <div className="matrix card">
        <table>
          <thead>
            <tr>
              <th className="mod">Permission</th>
              {visibleRoles.map(role => (
                <th key={role.id} style={{ textAlign: "center", minWidth: 120 }}>
                  <div style={{ textTransform: "none", letterSpacing: 0, fontSize: 12.5, color: "var(--text)" }}>
                    {role.is_system && (
                      <Lock size={10} style={{ marginRight: 3, display: "inline" }} />
                    )}
                    {role.name}
                  </div>
                  <div style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                    {role.users} user{role.users === 1 ? '' : 's'}
                  </div>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4 }}>
                    <button 
                      className="btn btn-xs btn-outline" 
                      title="Clone" 
                      onClick={() => handleCloneRole(role)}
                    >
                      <Copy size={10} />
                    </button>
                    {!role.is_system && (
                      <button 
                        className="btn btn-xs btn-danger-outline" 
                        title="Delete" 
                        onClick={() => handleDeleteRole(role)}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredModules.map(mod => {
              return (
                <React.Fragment key={mod.module}>
                  {/* Module Category Row */}
                  <tr className="mod-row">
                    <td className="perm">{mod.label}</td>
                    {visibleRoles.map(role => {
                      const perms = getRolePerms(role);
                      const grantedCount = mod.permissions.filter(p => perms.has(p.key)).length;
                      const isAll = grantedCount === mod.permissions.length;

                      return (
                        <td key={role.id} className="cell">
                          {!role.is_system ? (
                            <button 
                              className="btn btn-xs btn-ghost" 
                              onClick={() => handleToggleModuleForRole(role, mod)}
                            >
                              {isAll ? "None" : "All"}
                            </button>
                          ) : (
                            <span style={{ fontWeight: 600 }}>
                              {grantedCount}/{mod.permissions.length}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Individual Permission Rows */}
                  {mod.permissions.map(perm => (
                    <tr key={perm.key}>
                      <td className="perm">
                        <div style={{ fontWeight: 500 }}>
                          {perm.action.replace(/_/g, " ")}
                        </div>
                        <div className="mono" style={{ color: "var(--muted2)", fontSize: 11 }}>
                          {perm.key}
                        </div>
                      </td>
                      {visibleRoles.map(role => {
                        const isChecked = getRolePerms(role).has(perm.key);
                        return (
                          <td key={role.id} className="cell">
                            <input 
                              type="checkbox" 
                              aria-label={`${role.name}: ${perm.description}`}
                              checked={isChecked}
                              disabled={role.is_system}
                              onChange={() => handleToggleRolePerm(role, perm.key)}
                              style={{ 
                                width: 17, 
                                height: 17, 
                                accentColor: "var(--primary)", 
                                cursor: role.is_system ? "default" : "pointer" 
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesPermissionsView;
