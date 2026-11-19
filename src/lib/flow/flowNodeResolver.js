import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";
import { createFlowNodeResolver } from "./createFlowNodeResolver";

export const { resolveFlowNode, getFlowNode } = createFlowNodeResolver(MASTER_FLOW_NODES);
