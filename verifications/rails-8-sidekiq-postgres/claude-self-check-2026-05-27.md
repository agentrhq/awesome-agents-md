# Self-check · Rails 8 + Sidekiq + Postgres · 2026-05-27 · Claude (LLM)

Internal coherence check, not a real Claude Code product or Codex run. See [`verifications/README.md`](../README.md) for the limits.

## Prompt

From `stacks/rails-8-sidekiq-postgres/example-prompts.md`, prompt 1:

> Add `GET /users` that returns users with keyset pagination (20 per page) by id. Use Pagy or hand-roll. Include an RSpec request spec.

## Code produced

**`config/routes.rb`**

```ruby
resources :users, only: [:index]
```

**`app/controllers/users_controller.rb`**

```ruby
class UsersController < ApplicationController
  def index
    cursor = params[:cursor].presence
    users, next_cursor = Users::ListService.call(cursor: cursor, per_page: 20)

    render json: { users: users.as_json(only: [:id, :name, :email]), next_cursor: next_cursor }
  end
end
```

**`app/services/users/list_service.rb`**

```ruby
module Users
  class ListService
    PER_PAGE_DEFAULT = 20
    PER_PAGE_MAX = 50

    def self.call(cursor:, per_page: PER_PAGE_DEFAULT)
      per_page = [per_page.to_i.nonzero? || PER_PAGE_DEFAULT, PER_PAGE_MAX].min

      scope = User.order(id: :asc).limit(per_page + 1)
      scope = scope.where("id > ?", cursor.to_i) if cursor

      rows = scope.to_a
      has_more = rows.size > per_page
      page = has_more ? rows.first(per_page) : rows
      next_cursor = has_more ? page.last.id : nil

      [page, next_cursor]
    end
  end
end
```

**`spec/requests/users_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "GET /users", type: :request do
  let!(:users) { create_list(:user, 45) }

  it "returns the first page with a next_cursor" do
    get "/users"

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["users"].size).to eq(20)
    expect(body["next_cursor"]).to be_present
  end

  it "advances past the cursor on the second page" do
    get "/users"
    first_cursor = response.parsed_body["next_cursor"]

    get "/users", params: { cursor: first_cursor }
    body = response.parsed_body

    expect(body["users"].size).to eq(20)
    first_ids = User.order(id: :asc).limit(20).pluck(:id)
    second_ids = body["users"].map { |u| u["id"] }
    expect((first_ids & second_ids)).to be_empty
  end

  it "returns the remainder and no cursor on the last page" do
    get "/users"
    cursor1 = response.parsed_body["next_cursor"]
    get "/users", params: { cursor: cursor1 }
    cursor2 = response.parsed_body["next_cursor"]
    get "/users", params: { cursor: cursor2 }

    body = response.parsed_body
    expect(body["users"].size).to eq(5)
    expect(body["next_cursor"]).to be_nil
  end
end
```

**`spec/factories/users.rb`**

```ruby
FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:name)  { |n| "User #{n}" }
  end
end
```

## AGENTS.md compliance check

| Convention | Pass? | Note |
|---|---|---|
| Thin controller, dispatch to a service | yes | `UsersController#index` is 5 lines, calls `Users::ListService`. |
| Service in `app/services/`, plain Ruby, returns plain data | yes | `Users::ListService.call` returns a tuple, no Result wrapper here (could add). |
| Keyset pagination, no `OFFSET` | yes | `where("id > ?", cursor)`. |
| RSpec request spec at `spec/requests/users_spec.rb` | yes | Mirrors the controller path. |
| FactoryBot for fixtures, transactional DB rollback per test | yes | `create_list(:user, 45)`. RSpec's default transactional cleanup applies. |
| Strong params | n/a | Index has no body input; query params only. |
| ActiveRecord scopes for query composition | partial | I used inline `where` inside the service. A `User.scope :after_id, ->(id) { ... }` would push reusability up to the model, which the AGENTS.md prefers. |
| No callbacks for control flow | yes | None added. |

## Ambiguity feedback (what the AGENTS.md could clarify)

1. **Where should `Pagy.new` go?** The AGENTS.md mentions "keyset pagination" and the prompt offers "Pagy or hand-roll". I hand-rolled. The file doesn't pick a side. A line like "we hand-roll keyset because Pagy's offset mode is the default and we don't want to import a dep just for cursor" would close that.
2. **Service return shape.** The "Don't" section says services "return Result objects, never raise for control flow". My service returns a 2-tuple. A "Result over tuple" line would force the cleaner shape.
3. **Scope vs service.** The convention says "scopes for query composition... class methods for everything else". A keyset query is borderline. The AGENTS.md could pick: pagination logic lives in scope (`User.after(cursor).limit(20)`) and the service composes scopes, rather than the service issuing the SQL.

## Result

The file is internally coherent. A reasonable agent following it produces: thin controller, service in `app/services/`, keyset pagination, RSpec request spec with FactoryBot. Three refinements (Pagy vs hand-roll guidance, Result shape, scope vs service boundary) would make it stronger.
