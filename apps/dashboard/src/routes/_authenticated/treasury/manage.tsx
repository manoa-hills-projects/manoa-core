import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ConceptManagement } from "@/features/concept-management";
import { ExchangeRateForm } from "@/features/exchange-rate-set";
import { ExpenseRegister } from "@/features/expense-register";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Button } from "@/shared/ui/button";
import { PaymentsInbox } from "@/widgets/payments-inbox";

export const Route = createFileRoute("/_authenticated/treasury/manage")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Gestión",
	},
});

type Tab = "inbox" | "concepts" | "expenses" | "rate";

function RouteComponent() {
	const [tab, setTab] = useState<Tab>("inbox");

	return (
		<ProtectedRoute module="treasury">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Panel del tesorero
					</h1>
					<p className="text-muted-foreground">
						Bandeja de pagos, catálogo de conceptos, egresos y tasa del día.
					</p>
				</div>

				<div className="flex flex-wrap gap-2 border-b pb-2">
					<TabButton current={tab} value="inbox" onClick={setTab}>
						Bandeja de pagos
					</TabButton>
					<TabButton current={tab} value="concepts" onClick={setTab}>
						Conceptos
					</TabButton>
					<TabButton current={tab} value="expenses" onClick={setTab}>
						Egresos
					</TabButton>
					<TabButton current={tab} value="rate" onClick={setTab}>
						Tasa del día
					</TabButton>
				</div>

				{tab === "inbox" && <PaymentsInbox />}
				{tab === "concepts" && <ConceptManagement />}
				{tab === "expenses" && <ExpenseRegister />}
				{tab === "rate" && <ExchangeRateForm />}
			</div>
		</ProtectedRoute>
	);
}

interface TabButtonProps {
	current: Tab;
	value: Tab;
	onClick: (t: Tab) => void;
	children: React.ReactNode;
}
function TabButton({ current, value, onClick, children }: TabButtonProps) {
	const active = current === value;
	return (
		<Button
			variant={active ? "default" : "ghost"}
			size="sm"
			onClick={() => onClick(value)}
		>
			{children}
		</Button>
	);
}
