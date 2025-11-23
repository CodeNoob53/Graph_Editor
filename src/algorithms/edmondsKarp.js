/**
 * Знаходить максимальний потік в мережі використовуючи алгоритм Едмондса-Карпа
 * Вага ребер розглядається як пропускна здатність (capacity)
 *
 * @param {Object} cy - Екземпляр Cytoscape
 * @param {string} sourceId - ID витоку (source)
 * @param {string} sinkId - ID стоку (sink)
 * @returns {Object} Результат: максимальний потік та деталі потоку по ребрах
 */
export function findMaxFlowEdmondsKarp(cy, sourceId, sinkId) {
    if (!cy || typeof cy.nodes !== "function") {
        return { error: "Граф не ініціалізовано", details: "Екземпляр Cytoscape не знайдено" };
    }

    const sourceNode = cy.getElementById(sourceId);
    const sinkNode = cy.getElementById(sinkId);

    if (sourceNode.empty() || sinkNode.empty()) {
        return { error: "Вершини не знайдено", details: "Перевірте правильність ID витоку та стоку" };
    }

    if (sourceId === sinkId) {
        return { error: "Однакові вершини", details: "Витік і стік повинні бути різними вершинами" };
    }

    // 1. Побудова графа та залишкової мережі
    const nodes = cy.nodes().map(n => n.id());
    const edges = cy.edges();

    // capacity[u][v] - пропускна здатність ребра u->v
    const capacity = {};
    // flow[u][v] - поточний потік через ребро u->v
    const flow = {};
    // graph[u] - список суміжних вершин (для BFS)
    const graph = {};

    nodes.forEach(u => {
        capacity[u] = {};
        flow[u] = {};
        graph[u] = [];
        nodes.forEach(v => {
            capacity[u][v] = 0;
            flow[u][v] = 0;
        });
    });

    edges.forEach(edge => {
        const u = edge.data('source');
        const v = edge.data('target');
        const w = parseFloat(edge.data('weight')) || 0;

        // Додаємо пряме ребро
        capacity[u][v] = (capacity[u][v] || 0) + w;
        if (!graph[u].includes(v)) graph[u].push(v);
        if (!graph[v].includes(u)) graph[v].push(u); // Для залишкового графа (зворотні ребра)
    });

    let maxFlow = 0;

    // 2. Пошук шляхів збільшення потоку (BFS)
    while (true) {
        const parent = {};
        const queue = [sourceId];
        parent[sourceId] = sourceId;

        let pathFound = false;

        while (queue.length > 0) {
            const u = queue.shift();

            if (u === sinkId) {
                pathFound = true;
                break;
            }

            for (const v of graph[u]) {
                // Якщо вершина не відвідана і є залишкова пропускна здатність
                if (parent[v] === undefined && capacity[u][v] - flow[u][v] > 0) {
                    parent[v] = u;
                    queue.push(v);
                }
            }
        }

        if (!pathFound) break;

        // 3. Знаходимо вузьке місце (bottleneck) на знайденому шляху
        let pathFlow = Infinity;
        let v = sinkId;
        while (v !== sourceId) {
            const u = parent[v];
            pathFlow = Math.min(pathFlow, capacity[u][v] - flow[u][v]);
            v = u;
        }

        // 4. Оновлюємо потік вздовж шляху
        v = sinkId;
        while (v !== sourceId) {
            const u = parent[v];
            flow[u][v] += pathFlow;
            flow[v][u] -= pathFlow; // Зворотній потік
            v = u;
        }

        maxFlow += pathFlow;
    }

    // Формуємо результат для відображення
    const flowDetails = [];
    edges.forEach(edge => {
        const u = edge.data('source');
        const v = edge.data('target');
        const cap = capacity[u][v];
        const f = flow[u][v];

        if (f > 0) {
            flowDetails.push({
                edgeId: edge.id(),
                source: u,
                target: v,
                flow: f,
                capacity: cap
            });
        }
    });

    return {
        maxFlow,
        flowDetails,
        success: true,
        message: `Максимальний потік: ${maxFlow}`
    };
}
