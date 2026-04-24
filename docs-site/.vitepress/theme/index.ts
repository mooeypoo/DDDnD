import Theme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'

// Global components (will be created in Phase 3)
// import AuditStatusBadge from './components/AuditStatusBadge.vue'
// import ScenarioAuditSummary from './components/ScenarioAuditSummary.vue'
// import FindingsTable from './components/FindingsTable.vue'
// import ScenarioCatalog from './components/ScenarioCatalog.vue'
// import MetricBar from './components/MetricBar.vue'
// import BlogPostCard from './components/BlogPostCard.vue'
// import AuthorBlock from './components/AuthorBlock.vue'

export default {
  ...Theme,
  Layout,
  enhanceApp({ app }) {
    // Components will be registered here in Phase 3
    // app.component('AuditStatusBadge', AuditStatusBadge)
    // app.component('ScenarioAuditSummary', ScenarioAuditSummary)
    // app.component('FindingsTable', FindingsTable)
    // app.component('ScenarioCatalog', ScenarioCatalog)
    // app.component('MetricBar', MetricBar)
    // app.component('BlogPostCard', BlogPostCard)
    // app.component('AuthorBlock', AuthorBlock)
  },
}
