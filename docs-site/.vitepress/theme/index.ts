import Theme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'

import AuditStatusBadge from './components/AuditStatusBadge.vue'
import ScenarioAuditSummary from './components/ScenarioAuditSummary.vue'
import FindingsTable from './components/FindingsTable.vue'
import ScenarioCatalog from './components/ScenarioCatalog.vue'
import MetricBar from './components/MetricBar.vue'
import BlogPostCard from './components/BlogPostCard.vue'
import LatestBlogPosts from './components/LatestBlogPosts.vue'
import AuthorBlock from './components/AuthorBlock.vue'
import MetricsOverview from './components/MetricsOverview.vue'

export default {
  ...Theme,
  Layout,
  enhanceApp({ app }) {
    app.component('AuditStatusBadge', AuditStatusBadge)
    app.component('ScenarioAuditSummary', ScenarioAuditSummary)
    app.component('FindingsTable', FindingsTable)
    app.component('ScenarioCatalog', ScenarioCatalog)
    app.component('MetricBar', MetricBar)
    app.component('BlogPostCard', BlogPostCard)
    app.component('LatestBlogPosts', LatestBlogPosts)
    app.component('AuthorBlock', AuthorBlock)
    app.component('MetricsOverview', MetricsOverview)
  },
}
