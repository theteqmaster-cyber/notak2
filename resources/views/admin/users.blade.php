@extends('layouts.app')
@section('title', 'Users')
@section('page-title', 'Users')

@section('content')

<div class="card">
    <div class="card-header">
        <span class="card-title">{{ $users->total() }} registered user{{ $users->total() !== 1 ? 's' : '' }}</span>
    </div>

    @if($users->isEmpty())
        <div class="empty-state">
            <x-icon name="users" class="icon" style="color:var(--border)" />
            <p>No users yet.</p>
        </div>
    @else
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($users as $user)
                    <tr>
                        <td>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-light);
                                            color:var(--primary);font-weight:700;font-size:13px;
                                            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                    {{ strtoupper(substr($user->name, 0, 1)) }}
                                </div>
                                <span style="font-weight:500;">{{ $user->name }}</span>
                            </div>
                        </td>
                        <td style="font-size:13px;color:var(--text-2);">{{ $user->email }}</td>
                        <td>
                            @php
                                $roleColor = match($user->role) {
                                    'admin' => ['bg'=>'#EEF1FE','color'=>'#4F6EF7'],
                                    'ci'    => ['bg'=>'#FEF3C7','color'=>'#D97706'],
                                    default => ['bg'=>'#F1F5F9','color'=>'#64748B'],
                                };
                            @endphp
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;
                                         border-radius:999px;font-size:12px;font-weight:600;
                                         background:{{ $roleColor['bg'] }};color:{{ $roleColor['color'] }};">
                                {{ ucfirst($user->role) }}
                            </span>
                        </td>
                        <td>
                            @if($user->is_active)
                                <span style="color:#22C55E;font-size:12px;font-weight:600;">● Active</span>
                            @else
                                <span style="color:#EF4444;font-size:12px;font-weight:600;">● Suspended</span>
                            @endif
                        </td>
                        <td style="font-size:12px;color:var(--text-3);">
                            {{ $user->created_at->format('d M Y') }}
                        </td>
                        <td>
                            @if($user->role !== 'admin' && $user->id !== auth()->id())
                            <form method="POST"
                                  action="{{ route('admin.users.toggle', $user) }}"
                                  style="display:inline;">
                                @csrf @method('PATCH')
                                <button type="submit"
                                        class="btn btn-ghost btn-sm {{ $user->is_active ? '' : 'btn-success' }}"
                                        style="{{ $user->is_active ? 'color:var(--danger)' : 'color:#22C55E' }}"
                                        data-confirm="{{ $user->is_active ? 'Suspend' : 'Reactivate' }} {{ $user->name }}?">
                                    <x-icon :name="$user->is_active ? 'user-x' : 'user-check'" />
                                    {{ $user->is_active ? 'Suspend' : 'Reactivate' }}
                                </button>
                            </form>
                            @else
                                <span style="font-size:12px;color:var(--text-3);">—</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        {{-- Pagination --}}
        @if($users->hasPages())
        <div style="padding:16px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:var(--text-3);">
                Showing {{ $users->firstItem() }}–{{ $users->lastItem() }} of {{ $users->total() }}
            </span>
            {{ $users->links() }}
        </div>
        @endif
    @endif
</div>

@endsection
